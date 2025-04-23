import { currentUser } from '@clerk/nextjs/server';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getUserById } from '@/services/userService';
import { redirect } from 'next/navigation';

export default async function AccountPage() {
  // Try to get current user from Clerk
  const user = await currentUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  // Try to get user profile from Supabase
  const userProfile = await getUserById(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-6">
              {user.imageUrl && (
                <img 
                  src={user.imageUrl} 
                  alt={user.username || 'Profile'} 
                  className="w-24 h-24 rounded-full mr-6 object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-medium">{user.username || 'Username not set'}</h3>
                <p className="text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <Input 
                label="Username"
                defaultValue={userProfile?.username || user.username || ''}
                id="username"
                name="username"
                disabled
              />
              <Input 
                label="Bio"
                defaultValue={userProfile?.bio || ''}
                id="bio"
                name="bio"
                disabled
              />
              
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">
                  <strong>Supabase ID:</strong> {userProfile?.id || 'Not synced yet'}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Sync Status:</strong> {userProfile ? 'Synced with Supabase' : 'Not synced with Supabase'}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex flex-col space-y-2 w-full">
              <Button
                disabled={!userProfile}
                className="w-full sm:w-auto"
              >
                Update Profile
              </Button>
              {!userProfile && (
                <p className="text-sm text-amber-600">
                  Your account has not been synchronized with the database yet. This might take a moment.
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 