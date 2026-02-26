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
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { z } from "zod/v3";

const formSchema = z.object({
  pdfFooterText: z.string().max(500).optional(),
});

export function PortalPdfFooterText() {
  const { data } = useTeamQuery();
  const brandingMutation = useBrandingMutation();
  const branding = (data?.branding as TeamBranding) ?? {};

  const form = useZodForm(formSchema, {
    defaultValues: {
      pdfFooterText: branding.pdfFooterText ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    brandingMutation.mutate({
      pdfFooterText: values.pdfFooterText || undefined,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>PDF footer text</CardTitle>
            <CardDescription>
              Custom text displayed at the bottom of generated PDF documents
              (invoices, disclosures, payoff letters).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="pdfFooterText"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="max-w-[400px] min-h-[80px]"
                      placeholder="e.g. This document is confidential and intended for the recipient only."
                      maxLength={500}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>Max 500 characters.</div>
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
