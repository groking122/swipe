import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { getMemes } from '@/services/memeService';
import { auth } from '@clerk/nextjs/server';
import { hasInteraction } from '@/services/interactionService';
import LikeButton from '@/components/ui/LikeButton';
import type { InteractionType } from '@/types';

export default async function MemesPage() {
  // Get memes with pagination
  const memesResponse = await getMemes(1, 10);
  const { userId } = await auth();

  // Check which memes the user has liked, if logged in
  const userLikedMemes = new Map<string, boolean>();
  
  if (userId && memesResponse.data.length > 0) {
    // Check likes for each meme
    for (const meme of memesResponse.data) {
      const hasLiked = await hasInteraction(userId, meme.id, 'like' as InteractionType);
      userLikedMemes.set(meme.id, hasLiked);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Memes</h1>
        {userId && (
          <Link href="/memes/create" passHref>
            <Button>Upload Meme</Button>
          </Link>
        )}
      </div>

      {memesResponse.data.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-medium text-gray-600 mb-2">No memes found</h2>
          <p className="text-gray-500 mb-4">Be the first to upload a meme!</p>
          {userId && (
            <Link href="/memes/create" passHref>
              <Button>Upload Meme</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memesResponse.data.map((meme) => (
            <Card key={meme.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold truncate">{meme.title}</h2>
                  {meme.creator && (
                    <div className="flex items-center text-sm text-gray-500">
                      {meme.creator.avatarUrl && (
                        <img 
                          src={meme.creator.avatarUrl} 
                          alt={meme.creator.username} 
                          className="w-6 h-6 rounded-full mr-2"
                        />
                      )}
                      <span>{meme.creator.username}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="aspect-w-16 aspect-h-9 relative overflow-hidden rounded-md">
                  <img 
                    src={meme.imagePath} 
                    alt={meme.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Link href={`/memes/${meme.id}`} passHref>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <div className="flex space-x-2">
                    {userId ? (
                      <LikeButton 
                        memeId={meme.id} 
                        initialLiked={userLikedMemes.get(meme.id) || false} 
                      />
                    ) : (
                      <Button variant="ghost" size="sm">
                        <span className="mr-1">👍</span> Like
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <span className="mr-1">💾</span> Save
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {memesResponse.totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              disabled={memesResponse.page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
              Page {memesResponse.page} of {memesResponse.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={memesResponse.page === memesResponse.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 