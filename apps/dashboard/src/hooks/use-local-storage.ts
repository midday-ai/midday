"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";

// Original useLocalStorage hook (useState-like API)
export function useLocalStorage<T>(
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

// Filter-specific localStorage hook options
type UseFilterLocalStorageOptions<T> = {
  key: string;
  defaultValue?: T;
  debounceMs?: number;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  shouldSave?: (value: T) => boolean;
};

/**
 * Generic localStorage hook with debounced saving and initialization
 * Specifically designed for filter persistence
 */
export function useFilterLocalStorage<T>({
  key,
  defaultValue,
  debounceMs = 500,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  shouldSave = () => true,
}: UseFilterLocalStorageOptions<T>) {
  const hasInitialized = useRef(false);

  // Debounced save to localStorage
  const debouncedSave = useDebounceCallback((value: T) => {
    try {
      if (shouldSave(value)) {
        localStorage.setItem(key, serialize(value));
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error);
    }
  }, debounceMs);

  // Load from localStorage
  const loadFromStorage = useCallback((): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : null;
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error);
      localStorage.removeItem(key);
      return null;
    }
  }, [key, deserialize]);

  // Initialize from localStorage
  const initializeFromStorage = useCallback(
    (onApply: (value: T) => void, shouldApply?: () => boolean) => {
      if (hasInitialized.current) return;

      const saved = loadFromStorage();
      if (saved && (!shouldApply || shouldApply())) {
        onApply(saved);
      }

      hasInitialized.current = true;
    },
    [loadFromStorage],
  );

  // Save to localStorage
  const saveToStorage = useCallback(
    (value: T) => {
      if (!hasInitialized.current) return;
      debouncedSave(value);
    },
    [debouncedSave],
  );

  // Clear localStorage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to clear localStorage (${key}):`, error);
    }
  }, [key]);

  return {
    initializeFromStorage,
    saveToStorage,
    clearStorage,
    loadFromStorage,
  };
}
