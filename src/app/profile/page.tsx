import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Link href="/profile/account" passHref>
            <Button variant="outline">Account Settings</Button>
          </Link>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-gray-500">
              <p>Your activity will appear here.</p>
              <p className="mt-2 text-sm">
                Start by browsing and interacting with memes!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Your Saved Memes</h2>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-gray-500">
              <p>You haven't saved any memes yet.</p>
              <p className="mt-2 text-sm">
                Save memes to view them here later!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 