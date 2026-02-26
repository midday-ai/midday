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
  emailReplyTo: z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal("")),
});

export function PortalEmailReplyTo() {
  const { data } = useTeamQuery();
  const brandingMutation = useBrandingMutation();
  const branding = (data?.branding as TeamBranding) ?? {};

  const form = useZodForm(formSchema, {
    defaultValues: {
      emailReplyTo: branding.emailReplyTo ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    brandingMutation.mutate({
      emailReplyTo: values.emailReplyTo || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Reply-to email</CardTitle>
            <CardDescription>
              When merchants reply to emails from Abacus, responses will go to
              this address.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="emailReplyTo"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      className="max-w-[300px]"
                      placeholder={data?.email ?? "collections@company.com"}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>Defaults to your team email.</div>
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
