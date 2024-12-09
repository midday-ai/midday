"use client";

import { createCustomerAction } from "@/actions/create-customer-action";
import { createCustomerTagAction } from "@/actions/customer/create-customer-tag-action";
import { deleteCustomerTagAction } from "@/actions/customer/delete-customer-tag-action";
import { useCustomerParams } from "@/hooks/use-customer-params";
import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CountrySelector } from "../country-selector";
import type { Customer } from "../invoice/customer-details";
import {
  type AddressDetails,
  SearchAddressInput,
} from "../search-address-input";
import { SelectTags } from "../select-tags";
import { VatNumberInput } from "../vat-number-input";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, {
    message: "Name must be at least 1 characters.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  phone: z.string().nullable().optional(),
  website: z
    .string()
    .nullable()
    .optional()
    .transform((url) => url?.replace(/^https?:\/\//, "")),
  contact: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  vat_number: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional()
    .nullable(),
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
  data?: Customer;
};

export function CustomerForm({ data }: Props) {
  const [sections, setSections] = useState<string[]>(["general"]);
  const { setParams: setCustomerParams, name } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();

  const deleteCustomerTag = useAction(deleteCustomerTagAction);
  const createCustomerTag = useAction(createCustomerTagAction);

  const isEdit = !!data;

  const createCustomer = useAction(createCustomerAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setInvoiceParams({ selectedCustomerId: data.id });
        setCustomerParams(null);
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: undefined,
      name: name ?? undefined,
      email: undefined,
      website: undefined,
      address_line_1: undefined,
      address_line_2: undefined,
      city: undefined,
      state: undefined,
      country: undefined,
      zip: undefined,
      vat_number: undefined,
      note: undefined,
      phone: undefined,
      contact: undefined,
      tags: undefined,
    },
  });

  useEffect(() => {
    if (data) {
      setSections(["general", "details"]);
      form.reset({
        ...data,
        tags:
          data.tags?.map((tag) => ({
            id: tag.tag?.id ?? "",
            value: tag.tag?.name ?? "",
            label: tag.tag?.name ?? "",
          })) ?? undefined,
      });
    }
  }, [data]);

  const onSelectAddress = (address: AddressDetails) => {
    form.setValue("address_line_1", address.address_line_1);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("country", address.country);
    form.setValue("country_code", address.country_code);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createCustomer.execute)}>
        <div className="h-[calc(100vh-180px)] scrollbar-hide overflow-auto">
          <div>
            <Accordion
              key={sections.join("-")}
              type="multiple"
              defaultValue={sections}
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
                              autoFocus
                              placeholder="Acme Inc"
                              autoComplete="off"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="+1 (555) 123-4567"
                                type="tel"
                                autoComplete="off"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              placeholder="acme.com"
                              autoComplete="off"
                            />
                          </FormControl>
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
                              placeholder="John Doe"
                              autoComplete="off"
                            />
                          </FormControl>
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
                      name="address_line_1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Address Line 1
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="123 Main St"
                              autoComplete="off"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address_line_2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-[#878787] font-normal">
                            Address Line 2
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Suite 100"
                              autoComplete="off"
                            />
                          </FormControl>
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
                                defaultValue={field.value}
                                onSelect={(code, name) => {
                                  field.onChange(name);
                                  form.setValue("country_code", code);
                                }}
                              />
                            </FormControl>
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
                                placeholder="New York"
                                autoComplete="off"
                              />
                            </FormControl>
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
                                placeholder="NY"
                                autoComplete="off"
                              />
                            </FormControl>
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
                                placeholder="10001"
                                autoComplete="off"
                              />
                            </FormControl>
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
                        tags={form.getValues("tags")}
                        onRemove={(tag) => {
                          deleteCustomerTag.execute({
                            tagId: tag.id,
                            customerId: form.getValues("id")!,
                          });
                        }}
                        // Only for create customers
                        onCreate={(tag) => {
                          if (!isEdit) {
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
                          }
                        }}
                        // Only for edit customers
                        onSelect={(tag) => {
                          if (isEdit) {
                            createCustomerTag.execute({
                              tagId: tag.id,
                              customerId: form.getValues("id")!,
                            });
                          } else {
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
                          }
                        }}
                      />

                      <FormDescription className="mt-2">
                        Tags help categorize and track customer expenses.
                      </FormDescription>
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name="vat_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-[#878787] font-normal">
                              Tax ID / VAT Number
                            </FormLabel>
                            <FormControl>
                              <VatNumberInput
                                {...field}
                                countryCode={form.watch("country_code")}
                              />
                            </FormControl>
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
                              className="flex min-h-[80px] resize-none"
                              placeholder="Additional information..."
                              autoComplete="off"
                            />
                          </FormControl>
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
              isSubmitting={createCustomer.isExecuting}
              disabled={createCustomer.isExecuting || !form.formState.isValid}
            >
              {isEdit ? "Update" : "Create"}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
