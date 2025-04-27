"use client"

import { useState, useEffect, useTransition } from "react"
import Image from "next/image"
// Remove Tabs imports as they are handled by the parent page now
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs" 
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Upload, Trash2, Heart, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Link from 'next/link';
import { useUser } from "@clerk/nextjs"; // Import useUser
import { getUserMemesAction, deleteMemeAction, getLikedMemesAction } from "@/app/_actions/accountActions"; // Import actions
import type { Database } from "@/types/supabase"; // Import Database type
import { useToast } from "./ui/use-toast" // Import useToast

// Define Meme type matching the server action return type
type Meme = Database["public"]["Tables"]["memes"]["Row"];

// Add props to determine the content type
interface AccountContentProps {
  contentType: "uploads" | "liked";
}

// Remove unused mock data
// const mockUploadedMemes = [ ... ];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
}

// TODO: Fetch actual user data and memes
export default function AccountContent({ contentType }: AccountContentProps) {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Correct order for useTransition return values
  const [isPendingDelete, startDeleteTransition] = useTransition(); // Fixed order
  const [deletingMemeId, setDeletingMemeId] = useState<string | null>(null); // State to track which meme is being deleted

  // --- Fetch memes based on contentType ---
  useEffect(() => {
    if (isUserLoaded && user) {
      setIsLoading(true);
      setError(null);
      
      const actionToCall = contentType === 'uploads' ? getUserMemesAction : getLikedMemesAction;
      const logPrefix = `[AccountContent-${contentType}]`;

      console.log(`${logPrefix} Fetching ${contentType} memes...`);
      actionToCall()
        .then(result => {
          if (result.success) {
            console.log(`${logPrefix} Fetched ${result.data.length} memes.`);
            setMemes(result.data);
          } else {
            console.error(`${logPrefix} Error fetching memes:`, result.error);
            setError(result.error);
            setMemes([]);
          }
        })
        .catch(err => {
          console.error(`${logPrefix} Unexpected error fetching memes:`, err);
          setError("An unexpected error occurred.");
          setMemes([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isUserLoaded && !user) {
      setIsLoading(false);
      setError("Please sign in to view your content.");
      setMemes([]);
    }
    // Dependency array: removed the incorrect boolean call
  }, [isUserLoaded, user, contentType]);

  // --- Handle deleting a meme (only applicable for uploads) ---
  const handleDeleteMeme = (id: string) => {
    if (contentType !== 'uploads') return; 
    
    setDeletingMemeId(id); // Set the ID of the meme being deleted
    startDeleteTransition(async () => {
      console.log(`[AccountContent-uploads] Attempting to delete meme: ${id}`);
      const result = await deleteMemeAction(id);
      if (result.success) {
        console.log(`[AccountContent-uploads] Successfully deleted meme: ${id}`);
        setMemes(currentMemes => currentMemes.filter(meme => meme.id !== id));
        toast({ title: "Success", description: "Meme deleted successfully." });
      } else {
        console.error(`[AccountContent-uploads] Failed to delete meme ${id}:`, result.error);
        toast({ title: "Error", description: result.error, variant: "destructive" });
      }
      setDeletingMemeId(null); // Clear the deleting ID state
    });
  };

  // --- Render loading state ---
  if (isLoading) {
    // You might want a more specific loading indicator here, 
    // but the parent page has a Skeleton via Suspense for initial load.
    // This handles potential refetches or loading after initial mount.
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Render error state ---
  if (error) {
    return (
      <div className="text-center p-12 text-red-600 border border-dashed border-red-300 rounded-lg">
        <p>Error loading your memes: {error}</p>
      </div>
    );
  }

  // --- Determine titles and empty states based on contentType ---
  const titleText = contentType === 'uploads' ? "Your Uploaded Memes" : "Memes You\'ve Liked";
  const emptyIcon = contentType === 'uploads' ? <Upload className="mb-4 h-10 w-10 text-neutral-400" /> : <Heart className="mb-4 h-10 w-10 text-neutral-400" />;
  const emptyTitle = contentType === 'uploads' ? "No memes uploaded yet" : "No liked memes yet";
  const emptyDescription = contentType === 'uploads' ? "Your uploaded memes will appear here" : "Memes you like will appear here";
  const emptyButtonText = contentType === 'uploads' ? "Upload Your First Meme" : "Browse Memes";
  const emptyButtonLink = contentType === 'uploads' ? "/upload" : "/";

  // --- Render main content (Meme grid or empty state) ---
  return (
    <>
      {/* REMOVED PROFILE SECTION */}
      {/* <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900"> ... </div> */}
      
      {/* REMOVED TABS WRAPPER - Tabs are now in parent page */}
      {/* <Tabs defaultValue="uploads" className="w-full"> ... </Tabs> */}

      {/* Keep only the content previously inside TabsContent value="uploads" */}
      <h3 className="mb-4 text-lg font-medium">{titleText}</h3>
      {memes.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {memes.map((meme) => {
            // Determine if *this specific* meme is being deleted
            const isCurrentlyDeleting = deletingMemeId === meme.id;
            return (
              <motion.div key={meme.id} variants={item}>
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md dark:bg-neutral-800">
                  <div className="relative aspect-square bg-muted">
                    <Image 
                      src={meme.image_url || "/placeholder.svg"} 
                      alt={meme.title || "Meme"} 
                      fill 
                      className="object-cover" 
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2"> {/* Added gap */} 
                      <div className="flex-grow min-w-0"> {/* Allow text to shrink */} 
                        <h4 className="font-medium line-clamp-1 truncate" title={meme.title || ''}>{meme.title || "Untitled"}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"> {/* Allow wrapping */} 
                          <div className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                            <span className="text-xs font-medium">{meme.like_count ?? 0}</span> 
                          </div>
                          {meme.created_at && (
                            <>
                              <span className="text-xs text-neutral-500 hidden sm:inline">•</span>
                              <span className="text-xs text-neutral-500 whitespace-nowrap" title={new Date(meme.created_at).toLocaleString()}>
                                {new Date(meme.created_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Only show delete button for uploads */}
                      {contentType === 'uploads' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0 text-neutral-500 hover:text-rose-500 disabled:opacity-50"
                          onClick={() => handleDeleteMeme(meme.id)}
                          disabled={isPendingDelete && isCurrentlyDeleting} // Disable only the specific button being processed
                          title="Delete Meme"
                        >
                          {(isPendingDelete && isCurrentlyDeleting) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
          {emptyIcon}
          <h3 className="mb-2 text-lg font-medium">{emptyTitle}</h3>
          <p className="mb-4 text-sm text-neutral-500">{emptyDescription}</p>
          <Button
            asChild
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Link href={emptyButtonLink}>{emptyButtonText}</Link>
          </Button>
        </div>
      )}
      {/* REMOVED LIKED MEMES TAB CONTENT - Handled in parent page now */}
      {/* <TabsContent value="liked" className="mt-6"> ... </TabsContent> */}
    </>
  )
} 