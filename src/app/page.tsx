'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  // Use a fixed year value instead of dynamic Date call
  const currentYear = 2025;
  
  const handleFeedClick = () => {
    router.push('/feed');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">MemeSwipe</h1>
        <p className="text-xl text-gray-600">Swipe through memes and share with friends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Get Started</h2>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Sign up to start swiping through memes!</p>
            <p className="text-gray-600">Create an account to upload, save, and share your favorite memes with friends.</p>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col space-y-2">
              {isLoaded && !isSignedIn ? (
                <>
                  <SignUpButton mode="modal">
                    <Button>Sign Up</Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button variant="outline">Already have an account? Log in</Button>
                  </SignInButton>
                </>
              ) : (
                <Button onClick={handleFeedClick}>Go to Feed</Button>
              )}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Features</h2>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              <li>Swipe through curated memes</li>
              <li>Save your favorites</li>
              <li>Share with friends</li>
              <li>Upload your own memes</li>
              <li>Follow meme creators</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" onClick={handleFeedClick}>Browse Memes</Button>
          </CardFooter>
        </Card>
      </div>

      <div className="text-center">
        <p className="text-gray-500 text-sm" suppressHydrationWarning>
          &copy; {currentYear} MemeSwipe. All rights reserved.
        </p>
      </div>
    </div>
  );
}
