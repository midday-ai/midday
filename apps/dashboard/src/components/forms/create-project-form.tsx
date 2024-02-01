"use client";

import { createProjectAction } from "@/actions/project/create-project-action";
import { createProjectSchema } from "@/actions/schema";
import { useCurrentLocale } from "@/locales/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { currencies } from "@midday/location/src/currencies";
import { Button } from "@midday/ui/button";
import { Collapsible, CollapsibleContent } from "@midday/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { CurrencyInput } from "headless-currency-input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const uniqueCurrencies = () => {
  const uniqueSet = new Set(Object.values(currencies));
  return [...uniqueSet];
};

export function CreateProjectForm({ currencyCode, setOpen }) {
  const locale = useCurrentLocale();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const action = useAction(createProjectAction, {
    onSuccess: () => setOpen(null),
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      currency: currencyCode,
      revalidatePath: "/tracker",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(action.execute)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} autoFocus />
              </FormControl>
              <FormDescription>
                This is the project display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormDescription>
                Add a short description about the project.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Estimate</FormLabel>
              <FormControl>
                <Input placeholder="0" {...field} type="number" min={0} />
              </FormControl>
              <FormDescription>
                Set a goal for how long your project should take to complete and
                track its progress.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible open={isOpen}>
          <FormItem className="flex justify-between items-center">
            <FormLabel>Billable</FormLabel>

            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(value) => {
                        setIsOpen((prev) => !prev);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </FormItem>

          <CollapsibleContent className="space-y-2 w-full">
            <div className="flex space-x-4 mt-4">
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Hourly Rate</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none"
                        onValueChange={(values) => {
                          field.onChange(values.floatValue);
                        }}
                        currency={form.watch("currency")}
                        locale={locale}
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
                          <SelectValue placeholder="Select a verified email to display" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {uniqueCurrencies().map((currency) => (
                          <SelectItem value={currency} key={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="fixed bottom-8 w-full sm:max-w-[455px] right-8">
          <Button className="w-full" disabled={action.status === "executing"}>
            {action.status === "executing" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
