import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Image from 'next/image'
import { SwipeCard } from '@/components/SwipeCard'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: memes } = await supabase
    .from('memes')
    .select('*, user:users(username, avatar_url)')
    .order('created_at', { ascending: false })

  async function handleSwipe(memeId: string, direction: 'left' | 'right') {
    'use server'
    
    const supabase = createServerComponentClient({ cookies })
    const column = direction === 'right' ? 'like_count' : 'dislike_count'
    
    await supabase
      .from('memes')
      .update({ [column]: supabase.rpc('increment') })
      .eq('id', memeId)
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">MemeSwipe</h1>
      
      <div className="grid gap-4">
        {memes?.map((meme) => (
          <SwipeCard key={meme.id} onSwipe={(dir) => handleSwipe(meme.id, dir)}>
            <div className="relative aspect-square">
              <Image
                src={supabase.storage.from('memes').getPublicUrl(meme.image_path).data.publicUrl}
                alt="Meme"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </SwipeCard>
        ))}
      </div>
    </main>
  )
}