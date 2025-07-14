"use client";

import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { RESOURCES } from "@/utils/scopes";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { SCOPES, type Scope } from "@api/utils/scopes";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
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
import { ScrollArea } from "@midday/ui/scroll-area";
import { Separator } from "@midday/ui/separator";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, {
    message: "Name must be at least 1 character.",
  }),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  redirectUris: z.array(z.string().url()).min(1, {
    message: "At least one redirect URI is required.",
  }),
  scopes: z.array(z.enum(SCOPES)).min(1, {
    message: "At least one scope must be selected.",
  }),
  isPublic: z.boolean().default(false),
  active: z.boolean().default(true),
});

type Props = {
  data?: RouterOutputs["oauthApplications"]["get"];
};

export function OAuthApplicationForm({ data }: Props) {
  const { setParams } = useOAuthApplicationParams();
  const [redirectUriInput, setRedirectUriInput] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      description: data?.description || "",
      logoUrl: data?.logoUrl || "",
      website: data?.website || "",
      redirectUris: data?.redirectUris || [],
      scopes: (data?.scopes as Scope[]) || [],
      isPublic: data?.isPublic || false,
      active: data?.active ?? true,
    },
  });

  const createMutation = useMutation(
    trpc.oauthApplications.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        setParams(null);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.oauthApplications.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });
        setParams(null);
      },
    }),
  );

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (data?.id) {
      updateMutation.mutate({
        id: data.id,
        ...values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const addRedirectUri = () => {
    if (redirectUriInput.trim()) {
      try {
        new URL(redirectUriInput); // Validate URL
        const currentUris = form.getValues("redirectUris");
        if (!currentUris.includes(redirectUriInput)) {
          form.setValue("redirectUris", [...currentUris, redirectUriInput]);
          setRedirectUriInput("");
        }
      } catch {
        // Invalid URL - could show an error here
      }
    }
  };

  const removeRedirectUri = (index: number) => {
    const currentUris = form.getValues("redirectUris");
    form.setValue(
      "redirectUris",
      currentUris.filter((_, i) => i !== index),
    );
  };

  const handleScopeToggle = (scope: Scope, checked: boolean) => {
    const currentScopes = form.getValues("scopes");
    if (checked) {
      form.setValue("scopes", [...currentScopes, scope]);
    } else {
      form.setValue(
        "scopes",
        currentScopes.filter((s) => s !== scope),
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Application Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My Awesome App" autoFocus />
              </FormControl>
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
                <Textarea
                  {...field}
                  placeholder="A brief description of your application"
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                This will be shown to users during the authorization flow.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="logoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://example.com/logo.png"
                    type="url"
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
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://example.com"
                    type="url"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div>
          <Label>Redirect URIs</Label>
          <FormDescription className="mb-3">
            Add the URLs where users will be redirected after authorization.
          </FormDescription>

          <div className="flex gap-2 mb-3">
            <Input
              value={redirectUriInput}
              onChange={(e) => setRedirectUriInput(e.target.value)}
              placeholder="https://your-app.com/callback"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRedirectUri();
                }
              }}
            />
            <Button
              type="button"
              onClick={addRedirectUri}
              variant="outline"
              disabled={!redirectUriInput.trim()}
            >
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {form.watch("redirectUris").map((uri, index) => (
              <div
                key={uri}
                className="flex items-center justify-between p-2 bg-muted rounded"
              >
                <span className="text-sm font-mono">{uri}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRedirectUri(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          {form.formState.errors.redirectUris && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.redirectUris.message}
            </p>
          )}
        </div>

        <div>
          <Label>Permissions</Label>
          <FormDescription className="mb-4">
            Select which scopes this application can request access to.
          </FormDescription>

          <ScrollArea className="h-[300px] border rounded p-4">
            <div className="space-y-4">
              {RESOURCES.map((resource) => (
                <div key={resource.key}>
                  <h4 className="font-medium text-sm mb-2">{resource.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    {resource.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {resource.scopes.map((scopeObj) => {
                      const isChecked = form
                        .watch("scopes")
                        .includes(scopeObj.scope as Scope);
                      return (
                        <div
                          key={scopeObj.scope}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={scopeObj.scope}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleScopeToggle(
                                scopeObj.scope as Scope,
                                checked as boolean,
                              )
                            }
                          />
                          <Label
                            htmlFor={scopeObj.scope}
                            className="text-sm font-normal"
                          >
                            {scopeObj.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </ScrollArea>
          {form.formState.errors.scopes && (
            <p className="text-sm font-medium text-destructive mt-2">
              {form.formState.errors.scopes.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Public Application</FormLabel>
                </FormItem>
              )}
            />
            <FormDescription>
              Public applications cannot keep client secrets secure.
            </FormDescription>
          </div>

          {data?.id && (
            <div className="space-y-1">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormDescription>
                Inactive applications cannot be used for authorization.
              </FormDescription>
            </div>
          )}
        </div>

        <SubmitButton
          type="submit"
          className="w-full"
          isSubmitting={isPending}
          disabled={!form.formState.isDirty}
        >
          {data?.id ? "Update Application" : "Create Application"}
        </SubmitButton>
      </form>
    </Form>
  );
}
