"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  type AddressDetails,
  SearchAddressInput,
} from "../search-address-input";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name must be at least 1 characters.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  website: z
    .string()
    .url()
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
  zip: z
    .string()
    .min(1, {
      message: "ZIP Code must be at least 1 characters.",
    })
    .optional(),
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
  const { setParams } = useCustomerParams();

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
      zip: undefined,
      note: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  const onSelectAddress = (address: AddressDetails) => {
    console.log(address);
    form.setValue("address_line_1", address.address_line_1);
    form.setValue("address_line_2", address.address_line_2);
    form.setValue("city", address.city);
    form.setValue("state", address.state);
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
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    </div>

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
              onClick={() => setParams(null)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              disabled={form.formState.isSubmitting || !form.formState.isValid}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
