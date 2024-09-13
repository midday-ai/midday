"use server";

import { getStatus } from "@openstatus/react";

export async function fetchStatus() {
  const res = await getStatus("monorepo-platform");

  const { status } = res;

  return status;
}
