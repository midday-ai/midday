"use client";

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
  displayName: z.string().max(100).optional(),
});

export function PortalDisplayName() {
  const { data } = useTeamQuery();
  const brandingMutation = useBrandingMutation();
  const branding = (data?.branding as TeamBranding) ?? {};

  const form = useZodForm(formSchema, {
    defaultValues: {
      displayName: branding.displayName ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    brandingMutation.mutate({ displayName: values.displayName || undefined });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Portal display name</CardTitle>
            <CardDescription>
              The name shown to merchants on your portal. Defaults to your
              company name if not set.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className="max-w-[300px]"
                      placeholder={data?.name ?? "Company name"}
                      autoComplete="off"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>Leave blank to use your company name.</div>
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
