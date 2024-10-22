"use server";

import { IntegrationType } from "@midday/app-store/types";
import { LogEvents } from "@midday/events/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "./safe-action";

const settingSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  type: z.enum(["switch", "text", "number", "select"]),
  options: z.array(z.string()).optional(),
  required: z.boolean(),
  value: z.unknown(),
  min: z.number().optional(),
});

const equationVariableSchema = z.object({
  label: z.string(),
  description: z.string(),
  unit: z.string().optional(),
});

const equationConfigSchema = z.object({
  formula: z.string(),
  variables: z.record(equationVariableSchema),
});

const customFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "date"]),
  value: z.unknown(),
});

export const addAppToAccountAction = authActionClient
  .schema(
    z.object({
      api_version: z.string().optional().default("v1.0.0"),
      app_id: z.string(),
      app_name: z.string(),
      category: z.string(),
      config: z.record(z.string(), z.unknown()).optional(),
      created_at: z.string().optional().default(new Date().toISOString()),
      created_by: z.string().optional().default("Solomon AI"),
      custom_fields: z.array(customFieldSchema).optional(),
      data_sync_frequency: z
        .enum(["realtime", "daily", "weekly", "monthly", "manual"])
        .nullable(),
      dependencies: z.record(z.string(), z.unknown()).optional(),
      equationConfig: z.any().optional(),
      input_schema: z.record(z.string(), z.unknown()).optional(),
      output_schema: z.record(z.string(), z.unknown()).optional(),
      installed_at: z.string().optional().default(new Date().toISOString()),
      integration_config: z.record(z.string(), z.unknown()).optional(),
      // integration_type: z.nativeEnum(IntegrationType).optional(),
      is_public: z.boolean().default(false),
      last_sync_at: z.string().optional().default(new Date().toISOString()),
      last_updated: z.string().optional().default(new Date().toISOString()),
      model_type: z.string().optional(),
      settings: z.array(settingSchema).optional(),
      // supported_features: z.array(z.string()).optional(),
      sync_status: z
        .enum(["active", "paused", "error"])
        .optional()
        .default("active"),
      tags: z.array(z.string()).nullable(),
      user_permissions: z.record(z.string(), z.array(z.string())).optional(),
      version: z.string().optional(),
      webhook_url: z
        .string()
        .url()
        .optional()
        .default("https://gateway.solomonai-platform.com/webhook"),
    }),
  )
  .metadata({
    name: "add-app-to-account",
    track: {
      event: LogEvents.AddAppToAccount.name,
      channel: LogEvents.AddAppToAccount.channel,
    },
  } as any)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    const {
      app_id,
      app_name,
      category,
      settings,
      config,
      equationConfig,
      input_schema,
      output_schema,
      dependencies,
      user_permissions,
      custom_fields,
      is_public,
      tags,
      // integration_type,
      data_sync_frequency,
      sync_status,
      // supported_features,
      webhook_url,
      version,
      api_version,
      model_type,
    } = parsedInput;

    // Check if the app is already installed for the user
    const { data: existingApp } = await supabase
      .from("apps")
      .select("*")
      .eq("app_id", app_id)
      .eq("team_id", user.team_id as string)
      .single();

    if (existingApp) {
      throw new Error("App is already installed for this account");
    }

    // Add the app to the user's account
    const { data, error } = await supabase
      .from("apps")
      .insert({
        app_id,
        app_name,
        category,
        team_id: user.team_id,
        settings: settings as any,
        config: config as any,
        integration_config: config as any,
        // equation_config: equationConfig as any, // TODO: add support for storing equation
        input_schema: input_schema as any,
        output_schema: output_schema as any,
        dependencies: dependencies as any,
        user_permissions: user_permissions as any,
        custom_fields: custom_fields as any,
        installed_at: new Date().toISOString(),
        is_public,
        tags: tags || [],
        data_sync_frequency,
        sync_status,
        webhook_url,
        version,
        api_version,
        model_type,
        last_sync_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error adding app to account", error);
      throw new Error("Failed to add app to account");
    }

    revalidatePath("/apps");

    return data;
  });
