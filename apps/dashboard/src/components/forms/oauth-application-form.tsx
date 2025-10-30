"use client";

import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { useUpload } from "@/hooks/use-upload";
import { useUserQuery } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";
import { useOAuthSecretModalStore } from "@/store/oauth-secret-modal";
import { useTRPC } from "@/trpc/client";
import { RESOURCES } from "@/utils/scopes";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import {
  SCOPES,
  type Scope,
  type ScopePreset,
  scopePresets,
  scopesToName,
} from "@api/utils/scopes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFieldArray } from "react-hook-form";
import { z } from "zod/v3";
import { LogoUpload } from "../logo-upload";
import { ScopeSelector } from "../scope-selector";

const formSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, {
    message: "Name must be at least 1 character.",
  }),
  description: z.string().optional(),
  overview: z.string().optional(),
  developerName: z.string().optional(),
  logoUrl: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url().optional()),
  website: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url().optional()),
  installUrl: z
    .string()
    .transform((val) => (val === "" ? undefined : val))
    .pipe(z.string().url().optional()),
  screenshots: z.array(z.string()).max(4).default([]),
  redirectUris: z
    .array(
      z.object({
        url: z
          .string()
          .url()
          .refine(
            (url) => {
              try {
                const urlObj = new URL(url);
                // Allow localhost with HTTP, all others must use HTTPS
                if (
                  urlObj.hostname === "localhost" ||
                  urlObj.hostname === "127.0.0.1"
                ) {
                  return true;
                }
                return urlObj.protocol === "https:";
              } catch {
                return false;
              }
            },
            {
              message: "All URLs must use HTTPS, except for localhost.",
            },
          ),
      }),
    )
    .min(1, {
      message: "At least one redirect URI is required.",
    }),
  scopes: z
    .array(z.enum(SCOPES))
    .min(1, {
      message: "At least one scope must be selected.",
    })
    .default(["apis.all"]),
  isPublic: z.boolean().default(false),
  active: z.boolean().default(true),
});

type Props = {
  data?: RouterOutputs["oauthApplications"]["get"];
};

export function OAuthApplicationForm({ data }: Props) {
  const { setParams } = useOAuthApplicationParams();
  const { setSecret } = useOAuthSecretModalStore();
  const [preset, setPreset] = useState<ScopePreset>(() =>
    data?.scopes
      ? (scopesToName(data.scopes).preset as ScopePreset)
      : "all_access",
  );
  const { toast } = useToast();
  const { uploadFile } = useUpload();
  const { data: user } = useUserQuery();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useZodForm(formSchema, {
    defaultValues: {
      id: data?.id,
      name: data?.name || "",
      description: data?.description || "",
      overview: data?.overview || "",
      developerName: data?.developerName || "",
      logoUrl: data?.logoUrl || "",
      website: data?.website || "",
      installUrl: data?.installUrl || "",
      screenshots: data?.screenshots || [],
      redirectUris: data?.redirectUris?.map((uri) => ({ url: uri })) || [
        { url: "" },
      ],
      scopes: (data?.scopes as Scope[]) || ["apis.all"],
      isPublic: data?.isPublic || false,
      active: data?.active ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "redirectUris",
  });

  // Effect to reset form and ensure proper initialization when editing existing OAuth application
  useEffect(() => {
    if (data) {
      form.reset({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        overview: data.overview || "",
        developerName: data.developerName || "",
        logoUrl: data.logoUrl || "",
        website: data.website || "",
        installUrl: data.installUrl || "",
        screenshots: data.screenshots || [],
        redirectUris: data.redirectUris?.map((uri) => ({ url: uri })) || [
          { url: "" },
        ],
        scopes: (data.scopes as Scope[]) || ["apis.all"],
        isPublic: data.isPublic || false,
        active: data.active ?? true,
      });

      // Update preset state based on the scopes
      const detectedPreset = scopesToName(data.scopes).preset as ScopePreset;
      setPreset(detectedPreset);

      // If it's restricted, make sure the form has the correct scopes with dirty flag
      if (detectedPreset === "restricted") {
        form.setValue("scopes", data.scopes as Scope[], { shouldDirty: true });
      }
    }
  }, [data, form]);

  const createMutation = useMutation(
    trpc.oauthApplications.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });

        // Also invalidate the individual get query for consistency
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.get.queryKey(),
        });

        // Close the sheet first
        setParams(null);
        // Then open the modal with the secret
        if (result.clientSecret && result.name) {
          setSecret(result.clientSecret, result.name);
        }
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.oauthApplications.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.list.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.oauthApplications.get.queryKey(),
        });

        setParams(null);
      },
    }),
  );

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert redirect URIs from object array to string array for API
    const formattedValues = {
      ...values,
      redirectUris: values.redirectUris
        .map((uri) => uri.url)
        .filter((url) => url.trim() !== ""),
    };

    if (data?.id) {
      updateMutation.mutate({
        id: data.id,
        ...formattedValues,
      });
    } else {
      createMutation.mutate(formattedValues);
    }
  };

  const handleResourceScopeChange = (resourceKey: string, scope: string) => {
    if (preset !== "restricted") return;

    const currentScopes = form.getValues("scopes");
    const resource = RESOURCES.find((r) => r.key === resourceKey);
    if (!resource) return;

    // Remove any existing scopes for this resource
    const filteredScopes = currentScopes.filter(
      (currentScope: string) =>
        !resource.scopes.some((s) => s.scope === currentScope),
    );

    // Add the new scope if it's not empty
    const newScopes = scope
      ? [...filteredScopes, scope as Scope]
      : filteredScopes;

    form.setValue("scopes", newScopes, { shouldDirty: true });
  };

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
        // Get all valid scopes from RESOURCES
        const validScopes = RESOURCES.flatMap((resource) =>
          resource.scopes.map((scope) => scope.scope),
        );
        // Only keep scopes that are defined in RESOURCES
        newScopes = currentScopes.filter((scope: string): scope is Scope =>
          validScopes.some((validScope: string) => validScope === scope),
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

  const onScreenshotDrop = async (acceptedFiles: File[]) => {
    if (!user?.teamId) return;

    // Filter for image files only
    const imageFiles = acceptedFiles.filter((file) =>
      file.type.startsWith("image/"),
    );

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload only image files",
      });
      return;
    }

    const currentScreenshots = form.getValues("screenshots");

    // Check if adding these files would exceed the limit
    if (currentScreenshots.length + imageFiles.length > 4) {
      toast({
        title: "Too many screenshots",
        description: "You can only upload up to 4 screenshots",
      });
      return;
    }

    try {
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const originalFilename = file.name ?? "";
          const extension = originalFilename.split(".").pop() || "";
          const filename = extension ? `${nanoid()}.${extension}` : nanoid();

          const { url } = await uploadFile({
            bucket: "apps",
            path: ["screenshots", filename],
            file,
          });

          return url;
        }),
      );

      // Add uploaded URLs to the form
      form.setValue("screenshots", [...currentScreenshots, ...uploadedUrls], {
        shouldDirty: true,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload screenshots. Please try again.",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onScreenshotDrop,
    onDropRejected: (fileRejections) => {
      for (const rejection of fileRejections) {
        if (rejection.errors.find(({ code }) => code === "file-too-large")) {
          toast({
            title: "File too large",
            description: "Screenshots must be smaller than 3MB",
          });
        }
        if (rejection.errors.find(({ code }) => code === "file-invalid-type")) {
          toast({
            title: "Invalid file type",
            description: "Please upload only image files",
          });
        }
      }
    },
    maxSize: 3000000, // 3MB
    accept: {
      "image/*": [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".heic",
        ".heif",
        ".avif",
        ".tiff",
        ".bmp",
      ],
    },
  });

  const removeScreenshot = (index: number) => {
    const currentScreenshots = form.getValues("screenshots");
    const newScreenshots = currentScreenshots.filter((_, i) => i !== index);
    form.setValue("screenshots", newScreenshots, { shouldDirty: true });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Helper function to check if an accordion section has errors
  const hasErrors = (fields: string[]) => {
    return fields.some((field) => {
      const fieldError =
        form.formState.errors[field as keyof typeof form.formState.errors];
      return fieldError !== undefined;
    });
  };

  const generalErrors = hasErrors([
    "name",
    "description",
    "overview",
    "developerName",
    "logoUrl",
    "website",
    "installUrl",
  ]);
  const redirectErrors = hasErrors(["redirectUris"]);
  const permissionErrors = hasErrors(["scopes"]);
  const screenshotErrors = hasErrors(["screenshots"]);
  const settingsErrors = hasErrors(["isPublic", "active"]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-1 space-y-6 overflow-auto">
          <Accordion type="multiple" defaultValue={["general", "redirects"]}>
            <AccordionItem value="general">
              <AccordionTrigger
                className={cn(generalErrors && "text-destructive")}
              >
                General
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 flex flex-col">
                  <div className="flex-shrink-0">
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <LogoUpload
                              logoUrl={field.value}
                              onUpload={(url) => field.onChange(url)}
                              size={80}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="My Awesome App"
                            autoFocus
                          />
                        </FormControl>
                        <FormDescription>
                          Application name will be displayed in the OAuth
                          consent screen
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
                          <Textarea
                            {...field}
                            placeholder="A brief description of your application"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Description of your application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overview"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overview</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Detailed overview of your application"
                            rows={5}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed overview of your application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="developerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Developer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Acme Corp" />
                        </FormControl>
                        <FormDescription>
                          The person or company developing this application
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-6">
                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="https://example.com"
                                type="url"
                              />
                            </FormControl>
                            <FormDescription>
                              URL to the developer's website or documentation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <FormField
                        control={form.control}
                        name="installUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Install URL</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="https://example.com/install"
                                type="url"
                              />
                            </FormControl>
                            <FormDescription>
                              An optional URL for installing the application
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="redirects">
              <AccordionTrigger
                className={cn(redirectErrors && "text-destructive")}
              >
                Redirect URIs
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <FormDescription>
                  All OAuth redirect URLs, All URLs must use HTTPS, except for
                  localhost.
                </FormDescription>

                <div className="space-y-3 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`redirectUris.${index}.url`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://your-app.com/callback"
                                autoComplete="off"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ url: "" })}
                  className="border-none bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D] mt-2"
                >
                  Add more
                </Button>

                {form.formState.errors.redirectUris && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.redirectUris.message}
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="permissions">
              <AccordionTrigger
                className={cn(permissionErrors && "text-destructive")}
              >
                Permissions
              </AccordionTrigger>
              <AccordionContent>
                <Tabs
                  value={preset}
                  className="w-full"
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
                  This OAuth application will have{" "}
                  <span className="font-semibold">
                    {
                      scopePresets.find((scope) => scope.value === preset)
                        ?.description
                    }
                  </span>
                  .
                </p>

                <div className="mt-4">
                  {preset === "restricted" && (
                    <ScopeSelector
                      selectedScopes={form.watch("scopes")}
                      onResourceScopeChange={handleResourceScopeChange}
                      description="Select which scopes this OAuth application can request access to."
                      height="max-h-full"
                      errorMessage={form.formState.errors.scopes?.message}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="screenshots">
              <AccordionTrigger
                className={cn(screenshotErrors && "text-destructive")}
              >
                Screenshots
              </AccordionTrigger>
              <AccordionContent>
                <span className="text-[0.8rem] text-muted-foreground">
                  You can upload up to 4 screenshots that will be displayed on
                  the apps and integrations page.
                </span>
                <div className="space-y-4 mt-3">
                  <div
                    className={cn(
                      "w-full h-[120px] border-dotted border-2 border-border text-center flex flex-col justify-center space-y-1 transition-colors text-[#606060]",
                      isDragActive && "bg-secondary text-primary",
                    )}
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                      <div>
                        <p className="text-xs">Drop your screenshots here</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs">
                          Drop your files here, or{" "}
                          <span className="underline underline-offset-1">
                            click to browse.
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          3MB limit per file.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Display uploaded screenshots */}
                  {form.watch("screenshots").length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        {form.watch("screenshots").map((screenshot, index) => (
                          <div
                            key={`screenshot-${index}-${screenshot}`}
                            className="relative group"
                          >
                            <div className="aspect-video bg-muted overflow-hidden">
                              <img
                                src={screenshot}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeScreenshot(index)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {form.formState.errors.screenshots && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.screenshots.message}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="settings">
              <AccordionTrigger
                className={cn(settingsErrors && "text-destructive")}
              >
                Settings
              </AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                          <FormLabel className="!mt-0">Allow PKCE</FormLabel>
                          <FormDescription>
                            We strongly recommend using the PKCE flow for
                            increased security. Make sure your application
                            supports it.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {data?.id && (
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-x-2">
                          <div className="space-y-1">
                            <FormLabel className="!mt-0">Active</FormLabel>
                            <FormDescription>
                              Inactive applications cannot be used for
                              authorization.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="sticky bottom-0 bg-[#FAFAF9] dark:bg-[#121212] border-t pt-3 mt-4">
          <SubmitButton
            type="submit"
            className="w-full"
            isSubmitting={isPending}
            disabled={!form.formState.isDirty}
          >
            {data?.id ? "Update" : "Create"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
