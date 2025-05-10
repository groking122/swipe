// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import Image from 'next/image';
// import { notFound } from 'next/navigation';
// import type { Metadata, ResolvingMetadata } from 'next';
// import type { Meme } from '@/types/meme'; // Make sure this path is correct

// Minimal props for testing - using 'any' for params as a diagnostic step
type MinimalPageProps = {
  params: any; // Temporarily set to any for diagnostics
  // searchParams: { [key: string]: string | string[] | undefined };
};

// // Function to fetch a single meme (TEMPORARILY COMMENTED OUT)
// async function getMeme(id: string): Promise<Meme | null> {
//   const cookieStore = cookies();
//   const supabase = createServerComponentClient({ cookies: () => cookieStore });

//   const { data, error } = await supabase
//     .from('memes')
//     .select('id, title, description, image_url, like_count, created_at, twitter, website')
//     .eq('id', id)
//     .single();

//   if (error) {
//     console.error('Error fetching meme:', error.message);
//     return null;
//   }
//   if (!data) {
//     return null;
//   }

//   return {
//     id: data.id,
//     title: data.title,
//     description: data.description || '',
//     imageUrl: data.image_url,
//     likes: data.like_count,
//     createdAt: data.created_at,
//     twitter: data.twitter || undefined,
//     website: data.website || undefined,
//   };
// }

// // Function to generate metadata (TEMPORARILY COMMENTED OUT)
// export async function generateMetadata(
//   { params }: MinimalPageProps,
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   _parent: ResolvingMetadata
// ): Promise<Metadata> {
//   const id = params.id;
//   // const meme = await getMeme(id); // Dependencies commented out

//   // if (!meme) {
//   //   return {
//   //     title: 'Meme Not Found | MemeSwipe',
//   //     description: 'The meme you are looking for could not be found.',
//   //   };
//   // }

//   // const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
//   // const memePageUrl = `${baseUrl}/meme/${id}`;
//   // const absoluteImageUrl = meme.imageUrl.startsWith('http') ? meme.imageUrl : `${baseUrl}${meme.imageUrl}`;

//   return {
//     title: `Meme ${id} | MemeSwipe`, // Simplified title
//     description: `Details for meme ${id}`,
//     // openGraph: { ... }, // Temporarily removed
//     // twitter: { ... }, // Temporarily removed
//   };
// }

// The page component (Minimal Version)
export default async function MemePage({ params }: MinimalPageProps) {
  // const meme = await getMeme(params.id); // Temporarily commented out

  return (
    <div className="container mx-auto px-4 py-24">
      <article className="max-w-2xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-lg overflow-hidden p-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
          {/* Accessing params.id might cause runtime error if params is not an object, but this is for type checking diagnosis */}
          Meme ID: {params?.id || 'Params not as expected'}
        </h1>
        <p>Minimal content for testing.</p>
        {/* <Image src={meme.imageUrl} ... /> */}
        {/* Other meme details removed for testing */}
      </article>
    </div>
  );
} 