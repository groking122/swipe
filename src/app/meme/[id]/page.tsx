import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { MemeCard } from '@/components/meme-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

// This generates metadata for the page including Twitter card info
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  try {
    const { data: meme } = await supabase
      .from('memes')
      .select('id, title, description, image_url, like_count, created_at, twitter, website')
      .eq('id', params.id)
      .single();
      
    if (!meme) {
      return {
        title: 'Meme Not Found',
        description: 'The meme you are looking for does not exist.'
      };
    }
    
    const memeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://memeswipe.app'}/meme/${meme.id}`;
    
    return {
      title: meme.title || 'Check out this meme',
      description: meme.description || 'A hilarious meme on MemeSwipe',
      openGraph: {
        title: meme.title || 'Check out this meme',
        description: meme.description || 'A hilarious meme on MemeSwipe',
        url: memeUrl,
        siteName: 'MemeSwipe',
        images: [
          {
            url: meme.image_url || '/placeholder.svg',
            width: 1200,
            height: 630,
            alt: meme.title || 'Meme image'
          }
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: meme.title || 'Check out this meme',
        description: meme.description || 'A hilarious meme on MemeSwipe',
        site: '@thememeswipe',
        creator: '@thememeswipe',
        images: [meme.image_url || '/placeholder.svg']
      },
    };
  } catch (error) {
    console.error('Error fetching meme for metadata:', error);
    return {
      title: 'Meme Details',
      description: 'View this meme on MemeSwipe'
    };
  }
}

export default async function MemePage({ params }: PageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  
  try {
    const { data: meme, error } = await supabase
      .from('memes')
      .select('id, title, description, image_url, like_count, created_at, twitter, website')
      .eq('id', params.id)
      .single();
      
    if (error || !meme) {
      notFound();
    }
    
    // Transform the meme data to match the expected Meme type
    const formattedMeme = {
      id: meme.id,
      title: meme.title,
      description: meme.description,
      imageUrl: meme.image_url,
      likes: meme.like_count,
      createdAt: meme.created_at,
      twitter: meme.twitter,
      website: meme.website
    };

    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="inline-flex">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
        
        <div className="max-w-md mx-auto">
          <MemeCard meme={formattedMeme} />
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Share this meme with your friends!</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching meme:', error);
    notFound();
  }
} 