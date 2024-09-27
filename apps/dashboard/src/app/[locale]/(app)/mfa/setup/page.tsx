import { SetupMfa } from "@/components/setup-mfa";
import config from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Setup MFA | ${config.company}`,
};

export default function Setup() {
  return <SetupMfa />;
}
