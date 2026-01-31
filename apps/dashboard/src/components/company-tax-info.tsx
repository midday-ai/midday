"use client";

import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
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
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { z } from "zod/v3";

const formSchema = z.object({
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
});

export function CompanyTaxInfo() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      taxId: data?.taxId ?? "",
      registrationNumber: data?.registrationNumber ?? "",
    },
  });

  const onSubmit = form.handleSubmit((formData) => {
    updateTeamMutation.mutate({
      taxId: formData.taxId || null,
      registrationNumber: formData.registrationNumber || null,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tax information</CardTitle>
            <CardDescription>
              Your company's tax identification numbers. These will appear on
              invoices for tax compliance.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Tax ID / VAT Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g., DE123456789, US12-3456789"
                      className="max-w-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Company Registration Number
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g., HRB 12345"
                      className="max-w-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end">
            <SubmitButton
              isSubmitting={updateTeamMutation.isPending}
              disabled={updateTeamMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
