import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { upsertUser, getUserById } from '@/services/userService';
import { User } from '@/types';

export const useAuth = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUserWithDatabase = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn || !user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        // Get the user from the database using the Clerk user ID
        const userId = user.id;
        let dbUser = await getUserById(userId);

        // If the user doesn't exist in the database, create them
        if (!dbUser) {
          const newUser = {
            id: userId,
            email: user.emailAddresses[0]?.emailAddress || '',
            username: user.username || user.fullName || 'User',
            avatarUrl: user.imageUrl || '',
            createdAt: new Date().toISOString(),
          };
          
          dbUser = await upsertUser(newUser);
        }

        setCurrentUser(dbUser);
      } catch (error) {
        console.error('Error syncing user with database:', error);
      } finally {
        setLoading(false);
      }
    };

    syncUserWithDatabase();
  }, [isLoaded, isSignedIn, user]);

  return {
    user: currentUser,
    loading,
    isAuthenticated: isSignedIn,
  };
};

export default useAuth; 