"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTokenModalStore } from "@/store/token-modal";
import { useTRPC } from "@/trpc/client";
import {
  SCOPES,
  type Scope,
  type ScopePreset,
  scopePresets,
  scopesToName,
} from "@api/utils/scopes";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { ScrollArea } from "@midday/ui/scroll-area";
import { SubmitButton } from "@midday/ui/submit-button";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  scopes: z.array(z.enum(SCOPES)).default(["apis.all"]),
});

// Create a structure for resources and their scopes
const RESOURCES = [
  {
    key: "bank-accounts",
    name: "Bank Accounts",
    description: "Access to bank account data",
    scopes: [
      { scope: "bank-accounts.read", type: "read", label: "Read" },
      { scope: "bank-accounts.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "customers",
    name: "Customers",
    description: "Access to customer data",
    scopes: [
      { scope: "customers.read", type: "read", label: "Read" },
      { scope: "customers.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "documents",
    name: "Documents",
    description: "Access to document data",
    scopes: [
      { scope: "documents.read", type: "read", label: "Read" },
      { scope: "documents.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "inbox",
    name: "Inbox",
    description: "Access to inbox data",
    scopes: [
      { scope: "inbox.read", type: "read", label: "Read" },
      { scope: "inbox.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "invoices",
    name: "Invoices",
    description: "Access to invoice data",
    scopes: [
      { scope: "invoices.read", type: "read", label: "Read" },
      { scope: "invoices.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "transactions",
    name: "Transactions",
    description: "Access to transaction data",
    scopes: [
      { scope: "transactions.read", type: "read", label: "Read" },
      { scope: "transactions.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "teams",
    name: "Teams",
    description: "Access to team data",
    scopes: [
      { scope: "teams.read", type: "read", label: "Read" },
      { scope: "teams.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "users",
    name: "Users",
    description: "Access to user data",
    scopes: [
      { scope: "users.read", type: "read", label: "Read" },
      { scope: "users.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "tracker-entries",
    name: "Tracker Entries",
    description: "Access to tracker entry data",
    scopes: [
      { scope: "tracker-entries.read", type: "read", label: "Read" },
      { scope: "tracker-entries.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "tracker-projects",
    name: "Tracker Projects",
    description: "Access to tracker project data",
    scopes: [
      { scope: "tracker-projects.read", type: "read", label: "Read" },
      { scope: "tracker-projects.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "tags",
    name: "Tags",
    description: "Access to tag data",
    scopes: [
      { scope: "tags.read", type: "read", label: "Read" },
      { scope: "tags.write", type: "write", label: "Write" },
    ],
  },
  {
    key: "metrics",
    name: "Metrics",
    description: "Access to metrics data",
    scopes: [{ scope: "metrics.read", type: "read", label: "Read" }],
  },
  {
    key: "search",
    name: "Search",
    description: "Access to search functionality",
    scopes: [{ scope: "search.read", type: "read", label: "Read" }],
  },
] as const;

type Props = {
  onSuccess: (key: string | null) => void;
};

export function ApiKeyForm({ onSuccess }: Props) {
  const { data } = useTokenModalStore();
  const [preset, setPreset] = useState<ScopePreset>(() =>
    data?.scopes
      ? (scopesToName(data.scopes).preset as ScopePreset)
      : "all_access",
  );

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const upsertApiKeyMutation = useMutation(
    trpc.apiKeys.upsert.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.apiKeys.get.queryKey(),
        });

        onSuccess(data.key);
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id ?? undefined,
      name: data?.name ?? "",
      scopes: (data?.scopes as Scope[]) ?? ["apis.all"],
    },
  });

  // Helper function to get the selected scope for a resource from form state
  const getResourceScope = (resourceKey: string): string => {
    const currentScopes = form.watch("scopes");
    const resource = RESOURCES.find((r) => r.key === resourceKey);
    if (!resource) return "";

    // Find which scope from this resource is currently selected
    for (const scope of resource.scopes) {
      if (currentScopes.includes(scope.scope as Scope)) {
        return scope.scope;
      }
    }
    return "";
  };

  // Effect to ensure proper initialization when editing existing API key
  useEffect(() => {
    if (data?.scopes) {
      const detectedPreset = scopesToName(data.scopes).preset as ScopePreset;
      setPreset(detectedPreset);

      // If it's restricted, make sure the form has the correct scopes
      if (detectedPreset === "restricted") {
        form.setValue("scopes", data.scopes as Scope[], { shouldDirty: true });
      }
    }
  }, [data?.scopes, form]);

  // Update form scopes based on preset
  const updateScopesFromPreset = (newPreset: ScopePreset) => {
    let newScopes: Scope[] = [];

    switch (newPreset) {
      case "all_access":
        newScopes = ["apis.all"];
        break;
      case "read_only":
        newScopes = ["apis.read"];
        break;
      case "restricted": {
        // Keep existing scopes when switching to restricted mode
        const currentScopes = form.getValues("scopes");
        newScopes = currentScopes.filter((scope) =>
          RESOURCES.some((resource) =>
            resource.scopes.some((s) => s.scope === scope),
          ),
        );
        break;
      }
    }

    form.setValue("scopes", newScopes, { shouldDirty: true });
  };

  const handlePresetChange = (value: string) => {
    const scopePreset = value as ScopePreset;
    setPreset(scopePreset);
    updateScopesFromPreset(scopePreset);
  };

  const handleResourceScopeChange = (resourceKey: string, scope: string) => {
    if (preset !== "restricted") return;

    const currentScopes = form.getValues("scopes");
    const resource = RESOURCES.find((r) => r.key === resourceKey);
    if (!resource) return;

    // Remove any existing scopes for this resource
    const filteredScopes = currentScopes.filter(
      (currentScope) => !resource.scopes.some((s) => s.scope === currentScope),
    );

    // Add the new scope if it's not empty
    const newScopes = scope
      ? [...filteredScopes, scope as Scope]
      : filteredScopes;

    form.setValue("scopes", newScopes, { shouldDirty: true });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    upsertApiKeyMutation.mutate({
      id: values.id,
      name: values.name,
      scopes: values.scopes,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  autoFocus
                  className="mt-2"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs
          value={preset}
          className="mt-4 w-full"
          onValueChange={handlePresetChange}
        >
          <TabsList className="w-full flex">
            {scopePresets.map((scope) => (
              <TabsTrigger
                value={scope.value}
                className="flex-1"
                key={scope.value}
              >
                {scope.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="text-sm text-[#878787] mt-4">
          This API key will have{" "}
          <span className="font-semibold">
            {scopePresets.find((scope) => scope.value === preset)?.description}
          </span>
          .
        </p>

        <AnimatedSizeContainer height className="mt-4">
          {preset === "restricted" && (
            <ScrollArea className="flex flex-col text-sm max-h-[300px]">
              {RESOURCES.map((resource) => (
                <div
                  className="flex items-center justify-between py-4 border-b"
                  key={resource.key}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[#878787]">
                      {resource.name}
                    </span>
                  </div>
                  <div>
                    <RadioGroup
                      value={getResourceScope(resource.key)}
                      className="flex gap-4"
                      onValueChange={(value) =>
                        handleResourceScopeChange(resource.key, value)
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="" id={`${resource.key}-none`} />
                        <label
                          htmlFor={`${resource.key}-none`}
                          className="text-sm"
                        >
                          None
                        </label>
                      </div>
                      {resource.scopes.map((scope) => (
                        <div
                          className="flex items-center space-x-2"
                          key={scope.scope}
                        >
                          <RadioGroupItem
                            value={scope.scope}
                            id={`${resource.key}-${scope.type}`}
                          />
                          <label
                            htmlFor={`${resource.key}-${scope.type}`}
                            className="text-sm font-normal capitalize text-[#878787]"
                          >
                            {scope.label}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </AnimatedSizeContainer>

        <SubmitButton
          className="mt-6 w-full"
          type="submit"
          disabled={!form.formState.isDirty}
          isSubmitting={upsertApiKeyMutation.isPending}
        >
          {data?.id ? "Update" : "Create"}
        </SubmitButton>
      </form>
    </Form>
  );
}
