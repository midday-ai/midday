import { findMatchingCategory } from "@/actions/ai/find-matching-category";
import { createTransactionSchema } from "@/actions/schema";
import { useCurrentLocale } from "@/locales/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { readStreamableValue } from "ai/rsc";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Attachments } from "../attachments";
import { Note } from "../note";
import { SelectAccount } from "../select-account";
import { SelectCategory } from "../select-category";

export function CreateTransactionForm({ categories }: { categories: any }) {
  const locale = useCurrentLocale();
  const isSaving = false;
  const [streaming, setStreaming] = useState(false);

  const form = useForm<z.infer<typeof createTransactionSchema>>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      name: "",
      category_slug: "",
    },
  });

  function onSubmit(values: z.infer<typeof createTransactionSchema>) {
    // createTeam.execute({ name: values.name, redirectTo: "/teams/invite" });
  }

  const handleOnBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    // If the user is typing a query with multiple words, we want to stream the results

    // If no category set and name run

    const prompt = e.target.value;

    setStreaming(true);

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
      console.log(finalObject.category.slug);
      form.setValue("category_slug", finalObject.category.slug, {
        shouldValidate: true,
      });
    }

    setStreaming(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
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
                  <Input
                    placeholder="0"
                    {...field}
                    type="number"
                    min={0}
                    onChange={(evt) => field.onChange(+evt.target.value)}
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

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Currency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                    <SelectItem value="gbp">GBP</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="account"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Account</FormLabel>
                <FormControl>
                  <SelectAccount
                    onChange={field.onChange}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
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
                    onChange={field.onChange}
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
            name="assign"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Assign</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
              <Attachments id="" data={null} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="note">
            <AccordionTrigger>Note</AccordionTrigger>
            <AccordionContent>
              <Note
                id=""
                //    updateTransaction={updateTransaction}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
          <Button className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
