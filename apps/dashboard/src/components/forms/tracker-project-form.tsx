"use client";

import { useCurrentLocale } from "@/locales/client";
import { uniqueCurrencies } from "@midday/location/src/currencies";
import { Button } from "@midday/ui/button";
import { Collapsible, CollapsibleContent } from "@midday/ui/collapsible";
import { CurrencyInput } from "@midday/ui/currency-input";
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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  onSubmit: (data: any) => void;
  isSaving: boolean;
  form: any;
};

export function TrackerProjectForm({ onSubmit, isSaving, form }: Props) {
  const locale = useCurrentLocale();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(Boolean(form.getValues("billable")));
  }, [form.getValues()]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
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

        <div className="flex space-x-4 mt-4">
          <FormField
            control={form.control}
            name="estimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time Estimate</FormLabel>
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
                <FormDescription>
                  Set a goal for how long your project should take to complete
                  in hours.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Status</FormLabel>
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
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                        value={field.value}
                        onValueChange={(values) => {
                          field.onChange(values.floatValue);
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {uniqueCurrencies.map((currency) => (
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
          <Button className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
