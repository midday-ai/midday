"use client";

import { useCallback, useEffect, useState } from "react";

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with a function to handle SSR
  const [localState, setLocalState] = useState<T>(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const handleSetState = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(localState) : value;
        // Save state
        setLocalState(valueToStore);
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, localState],
  );

  useEffect(() => {
    // Handle storage changes in other tabs/windows
    function handleStorageChange(event: StorageEvent) {
      if (event.key === key && event.newValue) {
        setLocalState(JSON.parse(event.newValue));
      }
    }

    // Subscribe to storage changes
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
    }

    // Cleanup the event listener on component unmount
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
      }
    };
  }, [key]);

  return [localState, handleSetState];
}

export { useLocalStorage };
