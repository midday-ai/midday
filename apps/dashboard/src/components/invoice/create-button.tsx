"use client";

import { Button } from "@midday/ui/button";
import { useFormContext } from "react-hook-form";

export function CreateButton() {
  const form = useFormContext();
  const isValid = form.formState.isValid;

  return <Button disabled={!isValid}>Create</Button>;
}
