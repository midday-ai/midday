import type { Metadata } from "next";
import { Suspense } from "react";
import { RiskConfigForm } from "@/components/risk-config-form";

export const metadata: Metadata = {
  title: "Risk Configuration | Abacus",
};

export default function RiskConfigurationPage() {
  return (
    <Suspense>
      <RiskConfigForm />
    </Suspense>
  );
}
