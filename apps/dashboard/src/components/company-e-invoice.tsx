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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { z } from "zod/v3";

const formSchema = z.object({
  peppolId: z.string().optional(),
});

export function CompanyEInvoice() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      peppolId: data?.peppolId ?? "",
    },
  });

  const onSubmit = form.handleSubmit((formData) => {
    updateTeamMutation.mutate({
      peppolId: formData.peppolId || null,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>E-Invoice settings</CardTitle>
            <CardDescription>
              Configure Peppol e-invoicing for compliant electronic invoice
              delivery across Europe and beyond.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="peppolId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-[#878787] font-normal">
                    Peppol Participant ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g., 0192:123456789"
                      className="max-w-[300px]"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Your Peppol network identifier for sending e-invoices. Leave
                    empty if you don't have an existing Peppol registration.
                  </FormDescription>
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
