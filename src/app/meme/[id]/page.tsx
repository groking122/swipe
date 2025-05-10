import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import type { Meme } from '@/types/meme'; // Make sure this path is correct

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// Function to fetch a single meme
async function getMeme(id: string): Promise<Meme | null> {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data, error } = await supabase
    .from('memes')
    .select('id, title, description, image_url, like_count, created_at, twitter, website')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching meme:', error.message);
    // Don't call notFound() here, let the page component handle it
    // to allow generateMetadata to return a fallback title.
    return null;
  }
  if (!data) {
    return null;
  }

  // Transform data to Meme type
  return {
    id: data.id,
    title: data.title,
    description: data.description || '', // Ensure description is a string
    imageUrl: data.image_url,
    likes: data.like_count,
    createdAt: data.created_at,
    twitter: data.twitter || undefined,
    website: data.website || undefined,
  };
}

// Function to generate metadata
export async function generateMetadata(
  { params }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const id = params.id;
  const meme = await getMeme(id);

  if (!meme) {
    return {
      title: 'Meme Not Found | MemeSwipe',
      description: 'The meme you are looking for could not be found.',
    };
  }

  // Ensure NEXT_PUBLIC_BASE_URL is set in your environment variables
  // (e.g., in .env.local and in your Vercel project settings)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const memePageUrl = `${baseUrl}/meme/${meme.id}`;
  
  // Ensure imageUrl is absolute for Twitter cards
  const absoluteImageUrl = meme.imageUrl.startsWith('http') ? meme.imageUrl : `${baseUrl}${meme.imageUrl}`;

  return {
    title: `${meme.title} | MemeSwipe`,
    description: meme.description,
    openGraph: {
      title: meme.title,
      description: meme.description,
      images: [
        {
          url: absoluteImageUrl, // Must be absolute
          width: 800, // Optional, but recommended
          height: 600, // Optional, but recommended
          alt: meme.title,
        },
      ],
      url: memePageUrl,
      type: 'article', // More specific type for content
    },
    twitter: {
      card: 'summary_large_image',
      title: meme.title,
      description: meme.description,
      images: [absoluteImageUrl], // Must be an absolute URL
      site: '@thememeswipe', // Your main Twitter handle for the site
      // creator: meme.twitter ? (meme.twitter.startsWith('@') ? meme.twitter : `@${meme.twitter.split('/').pop()?.split('?')[0]}`) : undefined, // Optional: Author's handle if available
    },
    // Add other relevant meta tags like keywords, author, etc.
  };
}


// The page component
export default async function MemePage({ params }: Props) {
  const meme = await getMeme(params.id);

  if (!meme) {
    notFound(); // Triggers the Next.js 404 page
  }

  return (
    <div className="container mx-auto px-4 py-24"> {/* Added py-24 for top padding below fixed header */}
      <article className="max-w-2xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden">
        {/* Image Container with aspect ratio */}
        <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700"> {/* Common aspect ratio like 4:3 or 16:9 or 1:1 */}
          <Image
            src={meme.imageUrl}
            alt={meme.title}
            fill
            className="object-contain" // 'object-cover' or 'object-contain'
            priority // Good to prioritize the main image of the page
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">{meme.title}</h1>
          {meme.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4 text-base md:text-lg leading-relaxed">{meme.description}</p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            <p>Likes: {meme.likes.toLocaleString()}</p>
            <p>Posted: {new Date(meme.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {(meme.twitter || meme.website) && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">From the Author:</h3>
              {meme.twitter && (
                <div className="mb-2">
                  <a
                    href={meme.twitter.startsWith('http') ? meme.twitter : `https://twitter.com/${meme.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                  >
                    {/* You might want an icon here e.g. Twitter icon */}
                    View on X/Twitter
                  </a>
                </div>
              )}
              {meme.website && (
                <div>
                  <a
                    href={meme.website.startsWith('http') ? meme.website : `https://${meme.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                  >
                    {/* You might want an icon here e.g. Globe icon */}
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </article>
    </div>
  );
} 