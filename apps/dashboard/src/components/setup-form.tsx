"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
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
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { z } from "zod";
import { AvatarUpload } from "./avatar-upload";

const formSchema = z.object({
  full_name: z.string().min(2).max(32),
});

export function SetupForm() {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);

  const trpc = useTRPC();
  const { data: user } = useSuspenseQuery(trpc.user.me.queryOptions());

  const form = useZodForm(formSchema, {
    defaultValues: {
      full_name: user.full_name ?? "",
    },
  });

  const updateUserMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: () => {
        router.replace("/");
      },
    }),
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(updateUserMutation.mutate)}
        className="space-y-8"
      >
        <div className="flex justify-between items-end gap-4">
          <AvatarUpload
            userId={user.id}
            avatarUrl={user.avatar_url}
            size={80}
            ref={uploadRef}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => uploadRef.current?.click()}
          >
            Upload
          </Button>
        </div>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your first and last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton
          type="submit"
          className="w-full"
          isSubmitting={updateUserMutation.isPending}
        >
          Save
        </SubmitButton>
      </form>
    </Form>
  );
}
