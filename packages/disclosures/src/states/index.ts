import type { StateDisclosureConfig } from "../types";
import { californiaConfig } from "./california";
import { connecticutConfig } from "./connecticut";
import { floridaConfig } from "./florida";
import { newYorkConfig } from "./new-york";
import { georgiaConfig } from "./pending/georgia";
import { illinoisConfig } from "./pending/illinois";
import { marylandConfig } from "./pending/maryland";
import { newJerseyConfig } from "./pending/new-jersey";
import { utahConfig } from "./utah";
import { virginiaConfig } from "./virginia";

/** All configured state disclosure configs, keyed by state code */
const STATE_CONFIGS: Record<string, StateDisclosureConfig> = {
  // Active states
  NY: newYorkConfig,
  CA: californiaConfig,
  VA: virginiaConfig,
  UT: utahConfig,
  CT: connecticutConfig,
  FL: floridaConfig,
  // Pending states
  GA: georgiaConfig,
  NJ: newJerseyConfig,
  MD: marylandConfig,
  IL: illinoisConfig,
};

/**
 * Get the disclosure config for a state code.
 * Returns undefined if the state has no configured disclosure requirements.
 */
export function getStateConfig(
  stateCode: string,
): StateDisclosureConfig | undefined {
  return STATE_CONFIGS[stateCode.toUpperCase()];
}

/**
 * Get all state configs with active disclosure requirements.
 */
export function getAllActiveStates(): StateDisclosureConfig[] {
  return Object.values(STATE_CONFIGS).filter((c) => c.status === "active");
}

/**
 * Get all state configs with pending disclosure requirements.
 */
export function getAllPendingStates(): StateDisclosureConfig[] {
  return Object.values(STATE_CONFIGS).filter((c) => c.status === "pending");
}

/**
 * Get all state configs (active and pending).
 */
export function getAllStates(): StateDisclosureConfig[] {
  return Object.values(STATE_CONFIGS);
}

/**
 * Check if a state code has any disclosure requirements (active or pending).
 */
export function hasDisclosureRequirements(stateCode: string): boolean {
  return stateCode.toUpperCase() in STATE_CONFIGS;
}
