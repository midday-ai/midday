import { startAdmin } from "./server";

let initialized = false;

export async function ensureInitialized() {
  if (initialized) {
    return;
  }

  try {
    await startAdmin();
    initialized = true;
  } catch (error) {
    console.error("Failed to initialize Queue Board:", error);
    throw error;
  }
}
