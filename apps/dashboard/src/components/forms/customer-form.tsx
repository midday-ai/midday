"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
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
import { Label } from "@midday/ui/label";
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CountrySelector } from "../country-selector";
import {
  type AddressDetails,
  SearchAddressInput,
} from "../search-address-input";
import { SelectTags } from "../select-tags";
import { VatNumberInput } from "../vat-number-input";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  billingEmail: z
    .string()
    .email({
      message: "Email is not valid.",
    })
    .nullable()
    .optional(),
  phone: z.string().optional(),
  website: z
    .string()

    .optional()
    .transform((url) => url?.replace(/^https?:\/\//, "")),
  contact: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  zip: z.string().optional(),
  vatNumber: z.string().optional(),
  note: z.string().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional(),
});

const excludedDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "google.com",
  "aol.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "live.com",
  "hotmail.co.uk",
  "hotmail.com.au",
  "hotmail.com.br",
];

type Props = {
  data?: RouterOutputs["customers"]["getById"];
};

export function CustomerForm({ data }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEdit = !!data;

  const { setParams: setCustomerParams, name } = useCustomerParams();
  const { setParams: setInvoiceParams, type } = useInvoiceParams();
  const fromInvoice = type === "create" || type === "edit";

  const upsertCustomerMutation = useMutation(
    trpc.customers.upsert.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.customers.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.customers.get.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.customers.getById.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        // Close the customer form
        setCustomerParams(null);

        // If the customer is created from an invoice, set the customer as the selected customer
        if (data && fromInvoice) {
          setInvoiceParams({ selectedCustomerId: data.id });
        }
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: name ?? data?.name ?? undefined,
      email: data?.email ?? undefined,
      billingEmail: data?.billingEmail ?? null,
      website: data?.website ?? undefined,
      addressLine1: data?.addressLine1 ?? undefined,
      addressLine2: data?.addressLine2 ?? undefined,
      city: data?.city ?? undefined,
      state: data?.state ?? undefined,
      country: data?.country ?? undefined,
      countryCode: data?.countryCode ?? undefined,
      zip: data?.zip ?? undefined,
      phone: data?.phone ?? undefined,
      contact: data?.contact ?? undefined,
      note: data?.note ?? undefined,
      vatNumber: data?.vatNumber ?? undefined,
      tags:
        data?.tags?.map((tag) => ({
          id: tag?.id ?? "",
          value: tag?.name ?? "",
        })) ?? undefined,
    },
  });

  const onSelectAddress = (address: AddressDetails) => {
    form.setValue("addressLine1", address.address_line_1);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("country", address.country);
    form.setValue("countryCode", address.country_code);
    form.setValue("zip", address.zip);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    const domain = email.split("@").at(1);
    if (domain && !excludedDomains.includes(domain)) {
      const currentWebsite = form.getValues("website");
      if (!currentWebsite) {
        form.setValue("website", domain, { shouldValidate: true });
      }
    }
  };

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    const formattedData = {
      ...data,
      id: data.id || undefined,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      billingEmail: data.billingEmail || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      contact: data.contact || null,
      note: data.note || null,
      website: data.website || null,
      phone: data.phone || null,
      zip: data.zip || null,
      vatNumber: data.vatNumber || null,
      tags: data.tags?.length
        ? data.tags.map((tag) => ({
            id: tag.id,
            name: tag.value,
          }))
        : undefined,
      countryCode: data.countryCode || null,
    };

    upsertCustomerMutation.mutate(formattedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="h-[calc(100vh-180px)] scrollbar-hide overflow-auto">
          <div>
            <Accordion
              type="multiple"
              defaultValue={["general"]}
              className="space-y-6"
            >
              <AccordionItem value="general">
                <AccordionTrigger>General</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              autoFocus
                              placeholder="Acme Inc"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="acme@example.com"
                              type="email"
                              autoComplete="off"
                              onBlur={handleEmailBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="billingEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Billing Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                field.onChange(
                                  e.target.value.trim().length > 0
                                    ? e.target.value.trim()
                                    : null,
                                );
                              }}
                              placeholder="finance@example.com"
                              type="email"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormDescription>
                            This is an additional email that will be used to
                            send invoices to.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="+1 (555) 123-4567"
                              type="tel"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Website
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="acme.com"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Contact person
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="John Doe"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="details">
                <AccordionTrigger>Details</AccordionTrigger>

                <AccordionContent>
                  <div className="space-y-4">
                    <SearchAddressInput
                      onSelect={onSelectAddress}
                      placeholder="Search for an address"
                    />

                    <FormField
                      control={form.control}
                      name="addressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Address Line 1
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="123 Main St"
                              autoComplete="off"
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
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Address Line 2
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              placeholder="Suite 100"
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              Country
                            </FormLabel>
                            <FormControl>
                              <CountrySelector
                                defaultValue={field.value ?? ""}
                                onSelect={(code, name) => {
                                  field.onChange(name);
                                  form.setValue("countryCode", code);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              City
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="New York"
                                autoComplete="off"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              State / Province
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="NY"
                                autoComplete="off"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              ZIP Code / Postal Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="10001"
                                autoComplete="off"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="mt-6">
                      <Label
                        htmlFor="tags"
                        className="mb-2 text-xs text-[#878787] font-normal block"
                      >
                        Expense Tags
                      </Label>

                      <SelectTags
                        tags={(form.getValues("tags") ?? []).map((tag) => ({
                          id: tag.id,
                          value: tag.value,
                          label: tag.value,
                        }))}
                        onRemove={(tag) => {
                          form.setValue(
                            "tags",
                            form
                              .getValues("tags")
                              ?.filter((t) => t.id !== tag.id),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          );
                        }}
                        onSelect={(tag) => {
                          form.setValue(
                            "tags",
                            [
                              ...(form.getValues("tags") ?? []),
                              {
                                value: tag.value ?? "",
                                id: tag.id ?? "",
                              },
                            ],
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          );
                        }}
                      />

                      <FormDescription className="mt-2">
                        Tags help categorize and track customer expenses.
                      </FormDescription>
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="vatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              Tax ID / VAT Number
                            </FormLabel>
                            <FormControl>
                              <VatNumberInput
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="note"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Note
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              value={field.value ?? ""}
                              className="flex min-h-[80px] resize-none"
                              placeholder="Additional information..."
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-end mt-auto space-x-4">
            <Button
              variant="outline"
              onClick={() => setCustomerParams(null)}
              type="button"
            >
              Cancel
            </Button>

            <SubmitButton
              isSubmitting={upsertCustomerMutation.isPending}
              disabled={
                upsertCustomerMutation.isPending || !form.formState.isDirty
              }
            >
              {isEdit ? "Update" : "Create"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
