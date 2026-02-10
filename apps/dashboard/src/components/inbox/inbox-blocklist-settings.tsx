"use client";

import { Button } from "@midday/ui/button";
import {
  Card,
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
  FormMessage,
} from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { z } from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  entries: z.array(
    z
      .object({
        id: z.string().optional(),
        type: z.enum(["email", "domain"]),
        value: z.string().min(1, "Value is required"),
      })
      .superRefine((data, ctx) => {
        const trimmed = data.value.trim();

        if (data.type === "email") {
          const emailResult = z.string().email().safeParse(trimmed);
          if (!emailResult.success) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid email format",
              path: ["value"],
            });
          }
        }

        if (data.type === "domain") {
          // Domain validation regex pattern (RFC 1035 compliant)
          // Validates: alphanumeric, hyphens, dots, with at least one dot and valid TLD
          const domainPattern =
            /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

          if (!domainPattern.test(trimmed)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Invalid domain format",
              path: ["value"],
            });
          }
        }
      }),
  ),
});

export function InboxBlocklistSettings() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: blocklistData } = useSuspenseQuery(
    trpc.inbox.blocklist.get.queryOptions(),
  );

  const existingEntries = blocklistData ?? [];

  const form = useZodForm(formSchema, {
    defaultValues: {
      entries:
        existingEntries && existingEntries.length > 0
          ? existingEntries.map((entry) => ({
              id: entry.id,
              type: entry.type as "email" | "domain",
              value: entry.value,
            }))
          : [{ type: "domain" as const, value: "" }],
    },
  });

  // Reset form when data changes
  useEffect(() => {
    if (existingEntries) {
      form.reset({
        entries:
          existingEntries.length > 0
            ? existingEntries.map((entry) => ({
                id: entry.id,
                type: entry.type as "email" | "domain",
                value: entry.value,
              }))
            : [{ type: "domain" as const, value: "" }],
      });
    }
  }, [existingEntries]);

  const { fields, append, remove } = useFieldArray({
    name: "entries",
    control: form.control,
  });

  const createMutation = useMutation(
    trpc.inbox.blocklist.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.blocklist.get.queryKey(),
        });
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.inbox.blocklist.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.blocklist.get.queryKey(),
        });
      },
    }),
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const entriesToCreate = data.entries.filter(
      (entry) => !entry.id && entry.value.trim() !== "",
    );
    const entriesToDelete =
      existingEntries
        ?.filter(
          (existing) => !data.entries.some((entry) => entry.id === existing.id),
        )
        .map((entry) => entry.id) || [];

    // Delete removed entries
    for (const id of entriesToDelete) {
      await deleteMutation.mutateAsync({ id });
    }

    // Create new entries
    for (const entry of entriesToCreate) {
      await createMutation.mutateAsync({
        type: entry.type,
        value: entry.value.trim(),
      });
    }

    // Refresh the form with updated data
    queryClient.invalidateQueries({
      queryKey: trpc.inbox.blocklist.get.queryKey(),
    });
  });

  const handleRemove = (index: number, entryId?: string) => {
    if (entryId) {
      deleteMutation.mutate({ id: entryId });
    } else {
      remove(index);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocklist</CardTitle>
        <CardDescription>
          Block specific email addresses or domains from appearing in your
          inbox. For example, block "netflix.com" to prevent Netflix receipts
          from showing up.
        </CardDescription>
      </CardHeader>

      <div className="px-6 pb-6">
        <Form {...form}>
          <form id="blocklist-form" onSubmit={onSubmit}>
            <div className="max-w-[500px]">
              {fields.length === 0 ? (
                <div className="mt-3">
                  <div className="group flex items-center justify-between space-x-4">
                    <FormField
                      control={form.control}
                      name="entries.0.value"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="example.com"
                              autoComplete="off"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck="false"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Auto-detect email format and change type
                                const value = e.target.value;
                                if (value.includes("@")) {
                                  form.setValue("entries.0.type", "email");
                                }
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="entries.0.type"
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="min-w-[120px]">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="domain">Domain</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled
                    >
                      <Icons.Delete className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="entries.0.value"
                    render={() => (
                      <FormItem>
                        <FormMessage className="mt-2" />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                fields.map((field, index) => (
                  <div className="mt-3" key={field.id}>
                    <div className="group flex items-center justify-between space-x-4">
                      <FormField
                        control={form.control}
                        name={`entries.${index}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder={
                                  form.watch(`entries.${index}.type`) ===
                                  "email"
                                    ? "user@example.com"
                                    : "example.com"
                                }
                                autoComplete="off"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-detect email format and change type
                                  const value = e.target.value;
                                  if (value.includes("@")) {
                                    form.setValue(
                                      `entries.${index}.type`,
                                      "email",
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`entries.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="min-w-[120px]">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="domain">Domain</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleRemove(index, form.watch(`entries.${index}.id`))
                        }
                        disabled={
                          deleteMutation.isPending ||
                          (!!form.watch(`entries.${index}.id`) &&
                            deleteMutation.variables?.id ===
                              form.watch(`entries.${index}.id`))
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icons.Delete className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`entries.${index}.value`}
                      render={() => (
                        <FormItem>
                          <FormMessage className="mt-2" />
                        </FormItem>
                      )}
                    />
                  </div>
                ))
              )}

              <Button
                variant="outline"
                type="button"
                className="mt-4 border-none bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D]"
                onClick={() => append({ type: "domain", value: "" })}
              >
                <Icons.Add className="mr-2 h-3 w-3" />
                Add
              </Button>
            </div>
          </form>
        </Form>
      </div>
      <CardFooter className="flex items-center justify-end">
        <SubmitButton
          type="submit"
          form="blocklist-form"
          isSubmitting={createMutation.isPending || deleteMutation.isPending}
          disabled={createMutation.isPending || deleteMutation.isPending}
        >
          Save changes
        </SubmitButton>
      </CardFooter>
    </Card>
  );
}
