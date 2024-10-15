"use client";

import { Button } from "@midday/ui/button";
import { useFormContext } from "react-hook-form";

export function CreateButton() {
  const form = useFormContext();
  const isDirty = form.formState.isDirty;

  return <Button disabled={!isDirty}>Create</Button>;
}
