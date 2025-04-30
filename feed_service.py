from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from supabase import create_client, Client
import os
from hash_generator import generate_phash
from typing import Optional, Annotated

# Added imports for JWT handling
from fastapi import status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

# Placeholder for your user ID type if not string
# from uuid import UUID
# UserIdType = UUID
UserIdType = str

app = FastAPI()

# Initialize Supabase - USE SERVICE ROLE KEY HERE for backend operations
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") # <-- Use SERVICE KEY
if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables")
supabase: Client = create_client(supabase_url, supabase_key)

# --- Authentication Configuration ---
# !! IMPORTANT: Store these securely, e.g., in environment variables !!
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_very_secret_key_replace_me") # Replace with your actual secret key, load from env
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256") # Or whatever algorithm you use
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# This points to your token endpoint (where users log in to get a token)
# Adjust the URL "/token" if your login endpoint is different
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token") # Or your actual login URL

class TokenData(BaseModel):
    user_id: Optional[UserIdType] = None # Assuming user ID is stored in the token

# --- Updated Authentication Dependency ---
async def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> UserIdType:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # --- Extract User ID ---
        # Common practice is to store user ID in the 'sub' (subject) claim
        # If you store it differently (e.g., 'id'), change payload.get("sub")
        user_id: Optional[UserIdType] = payload.get("sub")
        if user_id is None:
            print("User ID ('sub') not found in JWT payload") # Debugging
            raise credentials_exception

        # Optional: Check if token contains expected scope or other claims

        # You might want to create a TokenData model instance here
        # token_data = TokenData(user_id=user_id)

    except JWTError as e:
        print(f"JWTError decoding token: {e}") # Debugging
        raise credentials_exception
    except Exception as e:
        # Catch other potential errors during decoding/validation
        print(f"Unexpected error validating token: {e}") # Debugging
        raise credentials_exception

    # If using UUIDs, you might need conversion:
    # try:
    #     user_id_uuid = UUID(user_id)
    #     return user_id_uuid
    # except ValueError:
    #     raise credentials_exception

    # Assuming user_id is already the correct UserIdType (string in our case)
    return user_id
# -----------------------------------------

class MemeCreate(BaseModel):
    image_url: str
    title: Optional[str] = None       # Added optional title
    description: Optional[str] = None # Added optional description

class SwipeAction(BaseModel):
    user_id: str # Matches user_id type 'text' in tables
    meme_id: str
    action: str  # 'like', 'dislike', 'skip'

# --- Core Algorithm ---
def calculate_score(meme):
    # Convert created_at string to datetime object if necessary
    # supabase-py might return datetime objects directly
    if isinstance(meme['created_at'], str):
        # Adjust format if needed, e.g., '%Y-%m-%dT%H:%M:%S.%f%z'
        created_at_dt = datetime.fromisoformat(meme['created_at'])
    else:
        created_at_dt = meme['created_at']

    # Ensure the datetime is timezone-aware (assuming UTC from Supabase)
    if created_at_dt.tzinfo is None:
        created_at_dt = created_at_dt.replace(tzinfo=timezone.utc)

    hours_old = (datetime.now(timezone.utc) - created_at_dt).total_seconds() / 3600
    # Use like_count and share_count from user's schema
    # Add small epsilon to avoid division by zero if hours_old is very small
    return (meme['like_count'] + meme['share_count']) / (hours_old + 0.001) # Use columns from user's schema

async def get_user_limits(user_id: str):
    # Get last 24h shown clusters from feed_history
    shown = supabase.table('feed_history') \
        .select('cluster_id, count(*)') \
        .eq('user_id', user_id) \
        .gte('shown_at', (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()) \
        .group('cluster_id') \
        .execute()

    # Get disliked clusters from votes table
    # IMPORTANT: Assumes 'skip' is the vote_type for dislikes. Change if needed.
    disliked = supabase.table('votes') \
        .select('cluster_id, count(*)') \
        .eq('user_id', user_id) \
        .eq('vote_type', 'dislike') \
        .group('cluster_id') \
        .execute()

    # Check for errors
    if shown.error:
        print(f"Error fetching shown history: {shown.error}")
        raise HTTPException(500, f"Error fetching shown history: {shown.error}")
    if disliked.error:
        print(f"Error fetching disliked votes: {disliked.error}")
        raise HTTPException(500, f"Error fetching disliked votes: {disliked.error}")

    return {
        # Use cluster_id as key
        'shown': {str(row['cluster_id']): row['count'] for row in shown.data},
        'disliked': {str(row['cluster_id']): row['count'] for row in disliked.data}
    }

# --- API Endpoints ---
@app.post("/create-meme")
async def create_meme(
    meme_data: MemeCreate, # Renamed input model instance
    current_user_id: Annotated[UserIdType, Depends(get_current_user_id)] # Dependency injection
):
    # Note: This endpoint needs updating to handle:
    # 1. cluster_id generation/assignment <-- DONE (using phash)
    # 2. user_id (creator) - potentially from auth context <-- DONE
    # 3. title, description if required <-- DONE
    try:
        phash = generate_phash(meme_data.image_url)
        insert_data = {
            'image_url': meme_data.image_url,
            'perceptual_hash': phash,
            'cluster_id': phash, # Set cluster_id to the perceptual hash
            'user_id': current_user_id, # Use ID from dependency
            'title': meme_data.title, # Use title from input
            'description': meme_data.description, # Use description from input
        }
        # Filter out None values for optional fields to avoid inserting NULL explicitly
        # if Supabase default handles it or column is not nullable
        insert_data = {k: v for k, v in insert_data.items() if v is not None}

        new_meme_res = supabase.table('memes').insert(insert_data).execute()

        if new_meme_res.error:
             raise HTTPException(500, f"Failed to create meme: {new_meme_res.error}")

        # Ensure data exists and is not empty before accessing index 0
        if not new_meme_res.data:
            raise HTTPException(500, "Meme creation returned no data.")

        return new_meme_res.data[0]
    except Exception as e:
        # Log the full error for debugging
        print(f"Error in create_meme: {e}")
        # Raise HTTPException with specific details if possible, else generic
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error during meme creation: {str(e)}")

@app.post("/swipe")
async def handle_swipe(action: SwipeAction):
    try:
        # Get meme's cluster_id
        meme_res = supabase.table('memes') \
            .select('cluster_id') \
            .eq('id', action.meme_id) \
            .maybe_single() \
            .execute()

        if meme_res.error or not meme_res.data:
             error_detail = f"Meme not found (id: {action.meme_id})" if not meme_res.data else str(meme_res.error)
             raise HTTPException(404, error_detail)

        meme_cluster_id = meme_res.data['cluster_id']

        # Record action in votes table
        vote_res = supabase.table('votes').insert({ \
            'user_id': action.user_id,
            'meme_id': action.meme_id,
            'vote_type': action.action, \
            'cluster_id': meme_cluster_id \
        }).execute()

        if vote_res.error:
             raise HTTPException(500, f"Failed to record vote: {vote_res.error}")

        # Optional: Update like/dislike counts on memes table (consider triggers/functions for this)

        return {"status": "success"}
    except Exception as e:
        print(f"Error in handle_swipe: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error during swipe action: {str(e)}")

@app.get("/feed/{user_id}")
async def get_feed(user_id: str):
    try:
        # 1. Get user limits based on cluster_id
        limits = await get_user_limits(user_id)

        # 2. Fetch candidate memes - select necessary fields including cluster_id
        memes_res = supabase.table('memes') \
            .select('id, image_url, perceptual_hash, created_at, like_count, share_count, cluster_id') \
            .order('created_at', desc=True) \
            .limit(1000).execute()

        if memes_res.error:
            raise HTTPException(500, f"Failed to fetch memes: {memes_res.error}")

        # 3. Filter and sort
        filtered_memes = []
        clusters_shown_in_this_feed = {} # Track clusters used in *this* feed response

        # Sort memes by score
        # Ensure created_at is parsed correctly for calculate_score
        sorted_memes = sorted(
            memes_res.data,
            key=lambda m: calculate_score(m),
            reverse=True
        )

        for meme in sorted_memes:
            cluster_id_str = str(meme['cluster_id']) # Use cluster_id as string key

            # Skip clusters the user has disliked >= 3 times (based on overall history)
            if limits['disliked'].get(cluster_id_str, 0) >= 3:
                continue

            # Skip clusters shown >= 2 times *in this specific feed response*
            if clusters_shown_in_this_feed.get(cluster_id_str, 0) >= 2:
                continue

            # Skip clusters shown too recently (Example: apply 24h limit directly if needed, though get_user_limits helps)
            # if limits['shown'].get(cluster_id_str, 0) > SOME_THRESHOLD_WITHIN_24H:
            #     continue # This might be redundant if get_user_limits works correctly

            # Check if meme was already seen (using feed_history - requires another query or different logic)
            # This basic filter doesn't prevent showing the *exact same meme* if it appears again
            # unless feed_history is checked more directly here.

            filtered_memes.append(meme)
            clusters_shown_in_this_feed[cluster_id_str] = clusters_shown_in_this_feed.get(cluster_id_str, 0) + 1

            # Limit feed size
            if len(filtered_memes) >= 20:
                break

        # 4. Record shown memes in feed_history
        if filtered_memes:
            records_to_insert = [{
                'user_id': user_id,
                'meme_id': m['id'],
                'cluster_id': m['cluster_id'] # Use cluster_id
            } for m in filtered_memes]
            history_res = supabase.table('feed_history').insert(records_to_insert).execute()
            if history_res.error:
                # Log this error but maybe don't fail the whole request?
                print(f"Warning: Failed to record feed history: {history_res.error}")

        return filtered_memes # Return the list of memes
    except Exception as e:
        print(f"Error in get_feed: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error fetching feed: {str(e)}")

# Optional: Add startup/shutdown events if needed
# Optional: Add more robust error handling and logging