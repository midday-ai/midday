/**
 * Hero text configuration.
 *
 * A/B testing via Statsig has been disabled for now.
 * To re-enable experiments later, restore the useHeroExperiment hook
 * and HERO_VARIANTS array from git history.
 */
export const HERO_TEXT = {
  headline: "The operating system for your funding business.",
  subheadline:
    "One place for portfolio management, risk alerts, and a branded merchant portal.",
} as const;
