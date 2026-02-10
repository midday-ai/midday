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
  FormMessage,
} from "@midday/ui/form";
import { SubmitButton } from "@midday/ui/submit-button";
import { z } from "zod/v3";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";
import { SelectFiscalMonth } from "./select-fiscal-month";

const formSchema = z.object({
  fiscalYearStartMonth: z.number().int().min(1).max(12).nullable(),
});

export function CompanyFiscalYear() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      fiscalYearStartMonth: data?.fiscalYearStartMonth ?? null,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateTeamMutation.mutate(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Fiscal year</CardTitle>
            <CardDescription>
              Set when your fiscal year begins. This determines the default date
              ranges for all reports and widgets throughout the application.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <FormField
              control={form.control}
              name="fiscalYearStartMonth"
              render={({ field }) => (
                <FormItem className="max-w-[300px]">
                  <FormControl>
                    <SelectFiscalMonth {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end">
            <SubmitButton
              disabled={updateTeamMutation.isPending || !form.formState.isDirty}
              isSubmitting={updateTeamMutation.isPending}
            >
              Save
            </SubmitButton>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
