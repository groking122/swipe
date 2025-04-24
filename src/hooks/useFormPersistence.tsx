'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFormPersistenceOptions<T> {
  key: string;
  initialState: T;
  expiryTime?: number; // in milliseconds
}

export function useFormPersistence<T>({
  key,
  initialState,
  expiryTime = 24 * 60 * 60 * 1000, // 24 hours by default
}: UseFormPersistenceOptions<T>) {
  const [state, setState] = useState<T>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedItem = localStorage.getItem(key);
      
      if (storedItem) {
        const { value, timestamp } = JSON.parse(storedItem);
        
        // Check if the stored data has expired
        const now = new Date().getTime();
        if (timestamp && now - timestamp < expiryTime) {
          setState(value);
        } else {
          // Clear expired data
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error loading form state from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, expiryTime]);

  // Update localStorage when state changes
  useEffect(() => {
    if (isLoaded) {
      try {
        const item = {
          value: state,
          timestamp: new Date().getTime(),
        };
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.error('Error saving form state to localStorage:', error);
      }
    }
  }, [key, state, isLoaded]);

  // Clear the persisted state
  const clearPersistedState = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setState(initialState);
    } catch (error) {
      console.error('Error clearing persisted state:', error);
    }
  }, [key, initialState]);

  return {
    state,
    setState,
    clearPersistedState,
    isLoaded,
  };
}