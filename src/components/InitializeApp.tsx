'use client';

import { useEffect, useState } from 'react';

/**
 * Component that initializes application resources when the app starts
 * This is a client component that calls the init API endpoint
 */
export default function InitializeApp() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run once when the component mounts
    if (!initialized) {
      initializeApp();
    }
  }, [initialized]);

  const initializeApp = async () => {
    try {
      console.log('Initializing application resources...');
      
      // Call the init API endpoint
      const response = await fetch('/api/init');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize application');
      }
      
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