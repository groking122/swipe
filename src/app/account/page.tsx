import { Suspense } from "react"
import { SignedIn, UserProfile } from "@clerk/nextjs";
import AccountContent from "@/components/account-content" // Use alias path
import { Skeleton } from "@/components/ui/skeleton" // Use alias path
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Heart, Settings } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  return (
    <SignedIn> { /* Ensure user is signed in to see anything */ }
      <div className="container mx-auto max-w-3xl px-4 pb-20 pt-6 space-y-8">
        { /* Button to Trigger User Profile Dialog */ }
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold md:text-3xl">Your Account</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                 <Settings className="mr-2 h-4 w-4" />
                 Account Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Account Settings</DialogTitle>
              </DialogHeader>
              {/* UserProfile is now inside the Dialog */}
              <UserProfile 
                routing="hash" 
                appearance={{ 
                  baseTheme: undefined, // Allow global theme to potentially apply
                  elements: { 
                    card: 'shadow-none border-0 w-full overflow-x-hidden', // Added w-full and overflow-x-hidden
                    rootBox: 'w-full'
                  } 
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        { /* Tabs for Uploads and Likes */ }
        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="uploads">
              <Upload className="mr-2 h-4 w-4" />
              Your Uploads
            </TabsTrigger>
            <TabsTrigger value="liked">
              <Heart className="mr-2 h-4 w-4" />
              Liked Memes
            </TabsTrigger>
          </TabsList>

          { /* Uploaded Memes Tab Content */ }
          <TabsContent value="uploads" className="mt-6">
            <Suspense fallback={<AccountContentSkeleton />}>
              { /* Pass contentType="uploads" */ }
              <AccountContent contentType="uploads" /> 
            </Suspense>
          </TabsContent>

          { /* Liked Memes Tab Content */ }
          <TabsContent value="liked" className="mt-6">
            <Suspense fallback={<AccountContentSkeleton />}>
              { /* Pass contentType="liked" */ }
              <AccountContent contentType="liked" /> 
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </SignedIn>
  )
}

// Keep the skeleton function, rename it slightly
function AccountContentSkeleton() {
  return (
    // Simplified skeleton just for the meme grid
    <div className="space-y-4">
      <Skeleton className="h-8 w-40 mb-4" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="aspect-square h-auto w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
} 