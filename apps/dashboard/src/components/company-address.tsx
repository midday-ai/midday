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
import dynamic from "next/dynamic";
import { z } from "zod/v3";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useZodForm } from "@/hooks/use-zod-form";

const SearchAddressInput = dynamic(
  () =>
    import("@/components/search-address-input").then(
      (mod) => mod.SearchAddressInput,
    ),
  { ssr: false },
);

const formSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
});

export function CompanyAddress() {
  const { data } = useTeamQuery();
  const updateTeamMutation = useTeamMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      addressLine1: data?.addressLine1 ?? "",
      addressLine2: data?.addressLine2 ?? "",
      city: data?.city ?? "",
      state: data?.state ?? "",
      zip: data?.zip ?? "",
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
            <CardTitle>Company address</CardTitle>
            <CardDescription>
              Your company address is used for invoices and e-invoicing
              compliance.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <SearchAddressInput
                placeholder="Search for an address..."
                onSelect={(result) => {
                  if (result.address_line_1) {
                    form.setValue("addressLine1", result.address_line_1);
                  }
                  if (result.city) {
                    form.setValue("city", result.city);
                  }
                  if (result.state) {
                    form.setValue("state", result.state);
                  }
                  if (result.zip) {
                    form.setValue("zip", result.zip);
                  }
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Street address"
                      className="max-w-[400px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address line 2</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Suite, apartment, etc."
                      className="max-w-[400px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 max-w-[400px]">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="City" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="State" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ZIP / Postal code"
                      className="max-w-[200px]"
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
