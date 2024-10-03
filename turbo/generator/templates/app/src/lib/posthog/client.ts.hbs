import { PostHog } from 'posthog-node';
import { env } from '@v1/env/web/client';

/**
 * This component is used to initialize the PostHog client.
 * @returns PostHog client or undefined if the environment variables are not set.
 */
export default function PostHogClient() {
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST) {
    return;
  }

  return new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1, // Sets how many capture calls we should flush the queue (in one batch).
    flushInterval: 0, // Sets how many milliseconds we should wait before flushing the queue.
  });
}
