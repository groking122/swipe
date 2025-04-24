import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { upsertUser } from '@/services/userService';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for direct database operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Process Clerk user ID to make it compatible with Supabase UUID format
 */
function processUserId(userId: string): string {
  return userId.startsWith('user_') ? userId.replace('user_', '') : userId;
}

export async function POST(req: Request) {
  // Get the webhook signature from the request headers
  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  // If there are no svix headers, return 400
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body of the request
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new svix instance with the webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Missing webhook secret' },
      { status: 500 }
    );
  }

  // Verify the webhook signature
  const svixHeaders = {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  };

  let evt: WebhookEvent;
  try {
    const webhook = new Webhook(webhookSecret);
    evt = webhook.verify(body, svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, username, image_url, first_name, last_name } = evt.data;
    
    // Extract primary email
    const primaryEmail = email_addresses?.[0]?.email_address;
    
    if (id && primaryEmail) {
      try {
        // Process the Clerk user ID to remove 'user_' prefix for compatibility with Supabase
        const dbUserId = processUserId(id);
        
        // Generate a username if not provided
        const generatedUsername = username ||
          `${first_name || ''}${last_name || ''}`.toLowerCase() ||
          primaryEmail.split('@')[0];
        
        console.log('Creating/updating user in Supabase:', {
          id: dbUserId,
          email: primaryEmail,
          username: generatedUsername
        });
        
        // First check if user exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', dbUserId)
          .single();
        
        if (checkError && !checkError.message.includes('No rows found')) {
          console.error('Error checking if user exists:', checkError);
        }
        
        if (existingUser) {
          // Update existing user
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: primaryEmail,
              username: generatedUsername,
              avatar_url: image_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', dbUserId);
          
          if (updateError) {
            console.error('Error updating user in Supabase:', updateError);
            return NextResponse.json(
              { error: `Error updating user: ${updateError.message}` },
              { status: 500 }
            );
          }
          
          console.log('User updated successfully in Supabase:', dbUserId);
        } else {
          // Create new user
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: dbUserId,
              email: primaryEmail,
              username: generatedUsername,
              avatar_url: image_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Error creating user in Supabase:', insertError);
            return NextResponse.json(
              { error: `Error creating user: ${insertError.message}` },
              { status: 500 }
            );
          }
          
          console.log('User created successfully in Supabase:', dbUserId);
        }
        
        return NextResponse.json({
          success: true,
          user: {
            id: dbUserId,
            email: primaryEmail,
            username: generatedUsername
          }
        });
      } catch (error) {
        console.error('Error syncing user with Supabase:', error);
        return NextResponse.json(
          { error: `Error syncing user: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }
  } else if (eventType === 'user.deleted') {
    const { id } = evt.data;
    
    if (id) {
      try {
        // Process the Clerk user ID to remove 'user_' prefix
        const dbUserId = processUserId(id);
        
        // Soft delete the user in Supabase
        await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', dbUserId);
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error deleting user in Supabase:', error);
        return NextResponse.json(
          { error: 'Error deleting user' },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true });
} 