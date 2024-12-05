"use server";

import { resend } from "@/utils/resend";

export async function subscribeAction(formData: FormData) {
  const email = formData.get("email") as string;

  return resend.contacts.create({
    email,
    audienceId: process.env.RESEND_AUDIENCE_ID!,
  });
}
