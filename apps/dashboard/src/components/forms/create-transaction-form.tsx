import { findMatchingCategory } from "@/actions/ai/find-matching-category";
import { createTransactionAction } from "@/actions/create-transaction-action";
import { createTransactionSchema } from "@/actions/schema";
import { AssignUser } from "@/components/assign-user";
import { Attachments } from "@/components/attachments";
import { SelectAccount } from "@/components/select-account";
import { SelectCategory } from "@/components/select-category";
import { SelectCurrency } from "@/components/select-currency";
import { zodResolver } from "@hookform/resolvers/zod";
import { uniqueCurrencies } from "@midday/location/currencies";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { CurrencyInput } from "@midday/ui/currency-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Select } from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { readStreamableValue } from "ai/rsc";
import { format } from "date-fns";
import { useAction } from "next-safe-action/hooks";
import { useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export function CreateTransactionForm({
  categories,
  userId,
  accountId,
  currency,
  onCreate,
}: {
  currency: string;
  categories: any;
  userId: string;
  accountId: string;
  onCreate: () => void;
}) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const createTransaction = useAction(createTransactionAction, {
    onSuccess: () => {
      onCreate();

      toast({
        title: "Transaction created",
        description: "Transaction created successfully",
        variant: "success",
      });
    },
  });

  const form = useForm<z.infer<typeof createTransactionSchema>>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      name: undefined,
      category_slug: undefined,
      date: new Date().toISOString(),
      bank_account_id: accountId,
      assigned_id: userId,
      note: undefined,
      currency,
      attachments: undefined,
    },
  });

  const category = form.watch("category_slug");
  const attachments = form.watch("attachments");

  const handleOnBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const prompt = e.target.value;

    if (!category && prompt.length > 5) {
      const { object } = await findMatchingCategory(
        prompt,
        categories?.map((category) => category.name),
      );

      let finalObject = {};

      for await (const partialObject of readStreamableValue(object)) {
        if (partialObject) {
          finalObject = {
            category: categories?.find(
              (category) => category.name === partialObject?.category,
            ),
          };
        }
      }

      if (finalObject?.category?.slug) {
        form.setValue("category_slug", finalObject.category.slug, {
          shouldValidate: true,
        });
      }
    }
  };

  useLayoutEffect(() => {
    // This is a workaround to ensure that the form is rendered before we try to set the focus
    setTimeout(() => {
      form.setFocus("name");
    }, 10);
  }, [form.setFocus]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(createTransaction.execute)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onBlur={handleOnBlur}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue);

                      if (values.floatValue && values.floatValue > 0) {
                        form.setValue("category_slug", "income");
                      }

                      if (
                        category === "income" &&
                        values.floatValue !== undefined &&
                        values.floatValue < 0
                      ) {
                        form.setValue("category_slug", undefined);
                      }
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Currency</FormLabel>

                <FormControl>
                  <SelectCurrency
                    className="w-full"
                    currencies={uniqueCurrencies}
                    onChange={field.onChange}
                    value={field.value}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="bank_account_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <SelectAccount
                    onChange={(value) => {
                      field.onChange(value.id);

                      if (value.currency) {
                        form.setValue("currency", value.currency);
                      }
                    }}
                    value={field.value}
                    placeholder="Select account"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Date</FormLabel>
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setIsOpen(true)}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                  </FormControl>

                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(value) => {
                        field.onChange(value?.toISOString());
                        setIsOpen(false);
                      }}
                      initialFocus
                      toDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="category_slug"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <SelectCategory
                    onChange={(value) => {
                      field.onChange(value?.slug);
                    }}
                    selected={categories?.find(
                      (category) => category.slug === field.value,
                    )}
                    hideLoading
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigned_id"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Assign</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <AssignUser
                      selectedId={field.value}
                      isLoading={false}
                      onSelect={field.onChange}
                    />
                  </FormControl>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Accordion type="multiple" defaultValue={["attachment"]}>
          <AccordionItem value="attachment">
            <AccordionTrigger>Attachment</AccordionTrigger>
            <AccordionContent>
              <Attachments
                prefix="manual"
                data={attachments}
                onUpload={(files) => {
                  form.setValue("attachments", files);
                }}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="note">
            <AccordionTrigger>Note</AccordionTrigger>
            <AccordionContent>
              <Textarea
                placeholder="Note"
                className="min-h-[100px] resize-none"
                onChange={(e) => {
                  form.setValue("note", e.target.value);
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
          <SubmitButton
            isSubmitting={createTransaction.isExecuting}
            className="w-full"
          >
            Save
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
