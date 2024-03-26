"use server";

import { getStatus } from "@openstatus/react";

export async function fetchStatus() {
  const res = await getStatus("midday");

  const { status } = res;

  return status;
}
