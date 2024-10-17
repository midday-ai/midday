"use client";

import { createCustomerAction } from "@/actions/create-customer-action";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Textarea } from "@midday/ui/textarea";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CountrySelector } from "../country-selector";
import {
  type AddressDetails,
  SearchAddressInput,
} from "../search-address-input";
import { VatNumberInput } from "../vat-number-input";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name must be at least 1 characters.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  phone: z.string().optional(),
  website: z
    .string()
    .optional()
    .transform((url) => url?.replace(/^https?:\/\//, "")),
  address_line_1: z
    .string()
    .min(1, {
      message: "Address Line 1 must be at least 1 characters.",
    })
    .optional(),
  address_line_2: z
    .string()
    .min(1, {
      message: "Address Line 2 must be at least 1 characters.",
    })
    .optional(),
  city: z
    .string()
    .min(1, {
      message: "City must be at least 1 characters.",
    })
    .optional(),
  state: z
    .string()
    .min(1, {
      message: "State must be at least 1 characters.",
    })
    .optional(),
  country: z
    .string()
    .min(1, {
      message: "Country must be at least 1 characters.",
    })
    .optional(),
  country_code: z.string().optional(),
  zip: z
    .string()
    .min(1, {
      message: "ZIP Code must be at least 1 characters.",
    })
    .optional(),
  vat_number: z.string().optional(),
  note: z.string().optional(),
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

export function CreateCustomerForm() {
  const { setParams: setCustomerParams } = useCustomerParams();
  const { setParams: setInvoiceParams } = useInvoiceParams();

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
      name: undefined,
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
    },
  });

  const onSelectAddress = (address: AddressDetails) => {
    form.setValue("address_line_1", address.address_line_1);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("country", address.country);
    form.setValue("country_code", address.country_code);
    form.setValue("zip", address.zip);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value;
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
        <ScrollArea className="h-[calc(100vh-180px)]">
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
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex justify-end mt-auto space-x-4">
            <Button
              variant="outline"
              onClick={() => setCustomerParams(null)}
              type="button"
            >
              Cancel
            </Button>

            <Button
              disabled={createCustomer.isExecuting || !form.formState.isValid}
            >
              {createCustomer.isExecuting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
