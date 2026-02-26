"use client";

import { ColorPicker } from "@/components/color-picker";
import { useBrandingMutation } from "@/hooks/use-branding-mutation";
import { useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
import type { TeamBranding } from "@db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { z } from "zod/v3";

const formSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color (e.g. #0ea5e9)")
    .optional()
    .or(z.literal("")),
});

export function PortalPrimaryColor() {
  const { data } = useTeamQuery();
  const brandingMutation = useBrandingMutation();
  const branding = (data?.branding as TeamBranding) ?? {};

  const form = useZodForm(formSchema, {
    defaultValues: {
      primaryColor: branding.primaryColor ?? "",
    },
  });

  const currentColor = form.watch("primaryColor");

  const onSubmit = form.handleSubmit((values) => {
    brandingMutation.mutate({
      primaryColor: values.primaryColor || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Primary color</CardTitle>
            <CardDescription>
              Used for buttons, links, and accents on your merchant portal.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative max-w-[300px]">
                      <ColorPicker
                        value={currentColor || "#0ea5e9"}
                        onSelect={(color) => {
                          form.setValue("primaryColor", color, {
                            shouldDirty: true,
                          });
                        }}
                      />
                      <Input
                        {...field}
                        className="pl-7"
                        placeholder="#0ea5e9"
                        autoComplete="off"
                        maxLength={7}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>Enter a hex color code.</div>
            <SubmitButton
              isSubmitting={brandingMutation.isPending}
              disabled={brandingMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
