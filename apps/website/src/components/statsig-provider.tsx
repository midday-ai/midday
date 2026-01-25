"use client";

import { LogLevel, StatsigProvider as BaseStatsigProvider } from "@statsig/react-bindings";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const VISITOR_ID_KEY = "abacus_visitor_id";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") {
    return "anonymous";
  }

  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  return visitorId;
}

interface StatsigProviderProps {
  children: ReactNode;
}

export function StatsigProvider({ children }: StatsigProviderProps) {
  const [userId, setUserId] = useState<string>("anonymous");

  useEffect(() => {
    setUserId(getOrCreateVisitorId());
  }, []);

  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;

  if (!clientKey) {
    return <>{children}</>;
  }

  return (
    <BaseStatsigProvider
      sdkKey={clientKey}
      user={{ userID: userId }}
      options={{ logLevel: LogLevel.Debug }}
    >
      {children}
    </BaseStatsigProvider>
  );
}
