"use client";

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
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";

const formSchema = z.object({
  vatNumber: z.string().optional(),
  taxId: z.string().optional(),
});

export function CompanyVatNumber() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      vatNumber: data?.vatNumber ?? "",
      taxId: data?.taxId ?? "",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateTeamMutation.mutate(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Tax identification</CardTitle>
            <CardDescription>
              Your VAT number and tax ID are required for e-invoicing compliance
              and will appear on invoices.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="vatNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. SE556123456701"
                      className="max-w-[300px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Secondary tax identifier"
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
