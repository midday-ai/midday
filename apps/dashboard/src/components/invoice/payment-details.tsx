"use client";

import { Editor } from "@/components/editor";

export function PaymentDetails() {
  return (
    <div>
      <span className="font-mono text-[#878787] mb-2 text-[11px] block">
        Payment details
      </span>

      <Editor className="h-[78px]" />
    </div>
  );
}
