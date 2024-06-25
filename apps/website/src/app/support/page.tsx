import { SupportForm } from "@/components/support-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Midday",
};

export default function Page() {
  return (
    <div className="max-w-[750px] m-auto">
      <h1 className="mt-24 font-medium text-center text-5xl mb-16 leading-snug">
        Support
      </h1>

      <SupportForm />
    </div>
  );
}
