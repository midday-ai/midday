"use client";

import { Button } from "@midday/ui/button";
import { useFormContext } from "react-hook-form";
import type { InvoiceFormValues } from "./schema";

export function CreateButton() {
  const { handleSubmit } = useFormContext<InvoiceFormValues>();

  const onSubmit = handleSubmit((data) => {
    // Handle form submission
    console.log(data);
  });

  return <Button onClick={onSubmit}>Create</Button>;
}
