"use client";

import { Editor } from "@/components/editor";
import { LabelInput } from "./label-input";

export function PaymentDetails() {
  return (
    <div>
      <LabelInput name="settings.paymentDetails" className="mb-2 block" />
      <Editor className="h-[78px]" />
    </div>
  );
}
