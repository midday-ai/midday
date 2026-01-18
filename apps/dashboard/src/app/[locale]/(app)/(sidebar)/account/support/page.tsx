import { SupportForm } from "@/components/support-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Abacus",
};

export default function Support() {
  return (
    <div className="space-y-12">
      <div className="max-w-[450px]">
        <SupportForm />
      </div>
    </div>
  );
}
