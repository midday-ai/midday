"use server";

import { revalidatePath } from "next/cache";

export async function revalidateAfterTeamChange() {
  // Revalidate the layout and all pages that depend on user/team data
  revalidatePath("/", "layout"); // This revalidates the entire layout
  revalidatePath("/"); // Revalidate the root page
  revalidatePath("/teams"); // Revalidate teams page
}
