"use client";

import { useStatsigClient } from "@statsig/react-bindings";
import { useMemo } from "react";

export const HERO_VARIANTS = [
  {
    id: "control",
    headline: "Run your MCA business without the manual work.",
    subheadline:
      "One place for portfolio management, risk alerts, and a branded merchant portal.",
  },
  {
    id: "autopilot",
    headline: "Run your MCA operation on autopilot.",
    subheadline:
      "Portfolio tracking, risk alerts, and a branded merchant portal — all in one place.",
  },
  {
    id: "fund-faster",
    headline: "Fund faster. Collect smarter. Do less manual work.",
    subheadline:
      "Manage your portfolio, catch risk early, and give merchants a professional portal.",
  },
  {
    id: "command-center",
    headline: "Replace spreadsheets with a real MCA command center.",
    subheadline:
      "Track deals, automate servicing, and monitor risk — without the busywork.",
  },
  {
    id: "all-in-one",
    headline: "All-in-one portfolio management for MCA teams.",
    subheadline:
      "Real-time risk monitoring, servicing workflows, and a branded merchant experience.",
  },
  {
    id: "stop-spreadsheets",
    headline: "Stop running your MCA business in spreadsheets.",
    subheadline:
      "Track performance, get risk alerts, and run merchant servicing from one dashboard.",
  },
  {
    id: "scale",
    headline: "Scale your MCA portfolio without adding headcount.",
    subheadline:
      "Automated tracking, risk alerts, and a merchant portal built for speed.",
  },
  {
    id: "everything",
    headline: "Everything you need to run MCA — in one place.",
    subheadline: "Portfolio management, risk alerts, and a branded merchant portal.",
  },
  {
    id: "ops-automated",
    headline: "MCA ops, automated.",
    subheadline:
      "Track your portfolio, spot risk instantly, and give merchants a portal they trust.",
  },
] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];

const EXPERIMENT_NAME = "hero_text";
const DEFAULT_VARIANT = HERO_VARIANTS[0];

interface UseHeroExperimentResult {
  variant: HeroVariant;
  isLoading: boolean;
  variantId: string;
}

export function useHeroExperiment(): UseHeroExperimentResult {
  const { client } = useStatsigClient();

  const variant = useMemo(() => {
    if (!client) {
      return DEFAULT_VARIANT;
    }

    try {
      const experiment = client.getExperiment(EXPERIMENT_NAME);
      const variantId = experiment.get("Hero Text", "control") as string;
      const matchedVariant = HERO_VARIANTS.find((v) => v.id === variantId);
      return matchedVariant ?? DEFAULT_VARIANT;
    } catch (error) {
      console.error("Error getting hero experiment:", error);
      return DEFAULT_VARIANT;
    }
  }, [client]);

  return {
    variant,
    isLoading: !client,
    variantId: variant.id,
  };
}
