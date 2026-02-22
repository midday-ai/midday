"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function revalidateAfterTeamChange() {
  // Revalidate the layout and all pages that depend on user/team data
  revalidatePath("/", "layout"); // This revalidates the entire layout
  revalidatePath("/"); // Revalidate the root page
  revalidatePath("/teams"); // Revalidate teams page

  // Redirect to home after revalidating
  redirect("/");
}

export async function redirectAfterAccountDeletion() {
  revalidatePath("/", "layout");
  redirect("/");
}

export async function revalidateInbox() {
  revalidatePath("/inbox");
}

export async function revalidateAfterCheckout() {
  revalidatePath("/", "layout");
  redirect("/");
}
