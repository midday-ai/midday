import { SetupMfa } from "@/components/setup-mfa";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup MFA | Midday",
};

export default function Setup() {
  return <SetupMfa />;
}
