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
  emailFromName: z.string().max(100).optional(),
});

export function PortalEmailFromName() {
  const { data } = useTeamQuery();
  const brandingMutation = useBrandingMutation();
  const branding = (data?.branding as TeamBranding) ?? {};

  const form = useZodForm(formSchema, {
    defaultValues: {
      emailFromName: branding.emailFromName ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    brandingMutation.mutate({
      emailFromName: values.emailFromName || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Email sender name</CardTitle>
            <CardDescription>
              The &quot;From&quot; name on emails sent to merchants (e.g.
              deals, portal invites, collection notices).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="emailFromName"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      className="max-w-[300px]"
                      placeholder={data?.name ?? "Your Company"}
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
            <div>Defaults to your company name.</div>
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
