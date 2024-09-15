"use client";

import React from "react";
import Script from "next/script";

/**
 * Represents a user in the Featurebase system.
 */
export type FeaturebaseUser = {
  /** The user's email address */
  email: string;
  /** The user's name */
  name: string;
  /** A unique identifier for the user */
  id: string;
  /** Optional URL to the user's profile picture */
  profilePicture?: string;
};

/**
 * Props for the FeaturebaseIntegration component.
 */
export type FeaturebaseProps = {
  /** The organization's identifier in Featurebase */
  organization: string;
  /** The user to be identified */
  user: FeaturebaseUser;
  /** Callback function called when the identification process completes */
  onIdentifyComplete?: (error?: Error) => void;
};

/**
 * Extends the global Window interface to include Featurebase.
 */
declare global {
  interface Window {
    Featurebase: {
      (action: string, data: any, callback?: (err?: Error) => void): void;
      q?: any[];
    };
  }
}

/**
 * Initializes the Featurebase function on the global window object.
 */
const initFeaturebase = () => {
  if (typeof window.Featurebase !== "function") {
    window.Featurebase = function () {
      (window.Featurebase.q = window.Featurebase.q || []).push(arguments);
    };
  }
};

/**
 * Identifies a user with Featurebase.
 *
 * @param organization - The organization's identifier
 * @param user - The user to be identified
 * @param callback - Optional callback function to be called after identification
 */
const identifyUser = (
  organization: string,
  user: FeaturebaseUser,
  callback?: (err?: Error) => void,
) => {
  window.Featurebase(
    "identify",
    {
      organization,
      ...user,
    },
    callback,
  );
};

/**
 * A component that integrates Featurebase into a React application.
 *
 * This component loads the Featurebase SDK and identifies the user.
 *
 * @example
 * ```tsx
 * <FeaturebaseIntegration
 *   organization="your-org"
 *   user={{
 *     email: "user@example.com",
 *     name: "John Doe",
 *     id: "123",
 *     profilePicture: "https://example.com/profile.jpg"
 *   }}
 *   onIdentifyComplete={(error) => {
 *     if (error) console.error(error);
 *     else console.log("Identification successful");
 *   }}
 * />
 * ```
 */
export const FeaturebaseIntegration: React.FC<FeaturebaseProps> = ({
  organization,
  user,
  onIdentifyComplete,
}) => {
  React.useEffect(() => {
    initFeaturebase();
    identifyUser(organization, user, (err) => {
      if (err) {
        console.error("Featurebase identification failed:", err);
      } else {
        console.log("Featurebase identification successful");
      }
      onIdentifyComplete?.(err);
    });
  }, [organization, user, onIdentifyComplete]);

  return (
    <Script
      src="https://do.featurebase.app/js/sdk.js"
      id="featurebase-sdk"
      strategy="afterInteractive"
    />
  );
};
