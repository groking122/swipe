import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { getMemeById } from '@/services/memeService';
import { hasInteraction } from '@/services/interactionService';
import type { InteractionType } from '@/types';
import LikeButton from '@/components/ui/LikeButton';
import LikeCount from '@/components/ui/LikeCount';
import type { Metadata } from 'next';

interface PageProps {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params;
  const meme = await getMemeById(id);
  
  if (!meme) {
    return {
      title: 'Meme Not Found',
    };
  }
  
  return {
    title: meme.title,
    description: `Meme uploaded by ${meme.creator?.username || 'Anonymous'}`,
  };
}

export default async function MemePage({ params }: PageProps) {
  const { id } = params;
  const session = await auth();
  const userId = session?.userId;
  
  // Fetch the meme
  const meme = await getMemeById(id);
  
  if (!meme) {
    notFound();
  }
  
  // Check if user has interacted with this meme
  let hasUserLiked = false;
  if (userId) {
    hasUserLiked = await hasInteraction(userId, id, 'like' as InteractionType);
  }
  
  // Format creation date
  const createdAt = new Date(meme.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/memes" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Memes
        </Link>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">{meme.title}</h1>
            <div className="text-sm text-gray-500 mt-1">
              <span>Posted on {createdAt}</span>
              {' • '}
              <span>By {meme.creator?.username || 'Anonymous'}</span>
            </div>
          </div>
          
          <div className="flex justify-center p-4 bg-gray-50">
            <img 
              src={meme.imagePath} 
              alt={meme.title} 
              className="max-h-[600px] object-contain"
            />
          </div>
          
          <div className="p-4 flex justify-between items-center">
            <div className="flex space-x-2">
              {/* Like Button and Count */}
              <div className="inline-flex items-center space-x-2">
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">
                    <LikeCount memeId={id} />
                  </span>
                  <span className="text-gray-500">Likes</span>
                </div>
                
                {userId && (
                  <LikeButton memeId={id} initialLiked={hasUserLiked} />
                )}
              </div>
            </div>
            
            {/* Share Button */}
            <Button 
              onClick={() => {}} 
              className="text-sm"
              variant="secondary"
            >
              Share
            </Button>
          </div>
        </Card>
        
        {/* Related memes could go here */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">More Memes</h2>
          <p className="text-gray-500">Explore more memes in our collection</p>
          <div className="mt-4">
            <Link href="/memes" className="text-blue-600 hover:text-blue-800">
              Browse All Memes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 