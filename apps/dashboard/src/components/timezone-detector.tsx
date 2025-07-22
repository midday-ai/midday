"use client";

import { useUserMutation, useUserQuery } from "@/hooks/use-user";
import { useEffect, useRef } from "react";

export function TimezoneDetector() {
  const { data: user } = useUserQuery();
  const updateUserMutation = useUserMutation();

  // Track if we've already attempted detection in this session
  const hasAttemptedDetection = useRef(false);

  useEffect(() => {
    // Skip if we've already attempted detection in this session
    if (hasAttemptedDetection.current) {
      return;
    }

    // Skip if user data isn't loaded yet
    if (!user) {
      return;
    }

    // Skip if currently updating to avoid race conditions
    if (updateUserMutation.isPending) {
      return;
    }

    let detectedTimezone: string;

    try {
      // Detect browser timezone using native API
      detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      hasAttemptedDetection.current = true;
      return;
    }

    // Skip if no valid timezone was detected
    if (!detectedTimezone) {
      hasAttemptedDetection.current = true;
      return;
    }

    const shouldUpdate =
      // Update if user has no timezone set (null/undefined)
      !user.timezone ||
      // Update if auto-sync is enabled (default true) AND detected timezone differs
      (user.timezoneAutoSync !== false && user.timezone !== detectedTimezone);

    if (shouldUpdate) {
      // Mark as attempted before making the request
      hasAttemptedDetection.current = true;

      updateUserMutation.mutate({ timezone: detectedTimezone });
    } else {
      // Mark as attempted even if no update was needed
      hasAttemptedDetection.current = true;
    }
  }, [user, updateUserMutation]);

  // This component doesn't render anything - it's a utility component
  return null;
}
