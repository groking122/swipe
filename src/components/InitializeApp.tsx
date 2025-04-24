'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Component that initializes application resources when the app starts
 * This is a client component that calls the init API endpoint
 */
export default function InitializeApp() {
  const { isLoaded } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run once when the component mounts and Clerk is loaded
    if (!initialized && isLoaded) {
      initializeApp();
    }
  }, [initialized, isLoaded]);

  const initializeApp = async () => {
    try {
      console.log('Initializing application resources...');
      
      // Call the init API endpoint
      const response = await fetch('/api/init');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to initialize application: ${response.status}`);
      }
      
      const data = await response.json().catch(() => ({}));
      console.log('Application initialized successfully:', data);
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing application:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      
      // Even if there's an error, mark as initialized to prevent infinite retries
      setInitialized(true);
    }
  };

  // This component doesn't render anything visible
  return null;
}