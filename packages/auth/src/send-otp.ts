import { SignInOtpEmail } from "@midday/email/emails/sign-in-otp";
import { render } from "@midday/email/render";
import { createElement } from "react";
import { Resend } from "resend";
export async function sendSignInOtp({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === "production")
      throw new Error("RESEND_API_KEY is required to send sign-in codes");
    console.info("[auth] OTP for", email, otp);
    return;
  }
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.AUTH_EMAIL_FROM ?? "Midday <middaybot@midday.ai>",
    to: email,
    subject: "Your Midday sign-in code",
    html: await render(createElement(SignInOtpEmail, { otp })),
  });
  if (error) throw new Error("Unable to send sign-in code");
}
