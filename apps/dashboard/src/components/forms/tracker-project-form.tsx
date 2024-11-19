"use client";

import { createProjectTagAction } from "@/actions/project/create-project-tag-action";
import { deleteProjectTagAction } from "@/actions/project/delete-project-tag-action";
import type { Customer } from "@/components/invoice/customer-details";
import { uniqueCurrencies } from "@midday/location/currencies";
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
import { Label } from "@midday/ui/label";
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
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { SearchCustomer } from "../search-customer";
import { SelectTags } from "../select-tags";

type Props = {
  onSubmit: (data: any) => void;
  isSaving: boolean;
  form: any;
  customers: Customer[];
};

export function TrackerProjectForm({
  onSubmit,
  isSaving,
  form,
  customers,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const deleteProjectTag = useAction(deleteProjectTagAction);
  const createProjectTag = useAction(createProjectTagAction);

  const isEdit = form.getValues("id") !== undefined;

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
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <FormControl>
                <SearchCustomer
                  data={customers}
                  onSelect={(id) => field.onChange(id)}
                  selectedId={field.value}
                />
              </FormControl>
              <FormDescription>
                Link a customer to enable direct invoicing.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6">
          <Label htmlFor="tags" className="mb-2 block">
            Expense Tags
          </Label>

          <SelectTags
            tags={form.getValues("tags")}
            onRemove={(tag) => {
              deleteProjectTag.execute({
                tagId: tag.id,
                projectId: form.getValues("id"),
              });
            }}
            // Only for create projects
            onCreate={(tag) => {
              if (!isEdit) {
                form.setValue(
                  "tags",
                  [
                    ...(form.getValues("tags") ?? []),
                    { id: tag.id, value: tag.name },
                  ],
                  {
                    shouldDirty: true,
                    shouldValidate: true,
                  },
                );
              }
            }}
            // Only for edit projects
            onSelect={(tag) => {
              if (isEdit) {
                createProjectTag.execute({
                  tagId: tag.id,
                  projectId: form.getValues("id"),
                });
              }
            }}
          />

          <FormDescription className="mt-2">
            Tags help categorize and track project expenses.
          </FormDescription>
        </div>

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
                        min={0}
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
          <Button
            className="w-full"
            disabled={isSaving || !form.formState.isValid}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
