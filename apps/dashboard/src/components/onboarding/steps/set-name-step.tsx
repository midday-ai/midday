"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v3";
import { AvatarUpload } from "@/components/avatar-upload";
import { useUserMutation } from "@/hooks/use-user";
import { useZodForm } from "@/hooks/use-zod-form";

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters.").max(32),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  userId: string;
  avatarUrl?: string | null;
  onComplete: () => void;
  onLoadingChange?: (loading: boolean) => void;
};

export function SetNameStep({
  userId,
  avatarUrl,
  onComplete,
  onLoadingChange,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittedRef = useRef(false);
  const updateUserMutation = useUserMutation();

  const form = useZodForm(formSchema, {
    defaultValues: {
      fullName: "",
    },
  });

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  const isFormLocked = isLoading || isSubmittedRef.current;

  async function onSubmit(values: FormValues) {
    if (isFormLocked) return;

    setIsLoading(true);
    isSubmittedRef.current = true;

    try {
      await updateUserMutation.mutateAsync({ fullName: values.fullName });
      onComplete();
    } catch {
      setIsLoading(false);
      isSubmittedRef.current = false;
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex justify-center"
      >
        <AvatarUpload userId={userId} avatarUrl={avatarUrl} size={80} />
      </motion.div>

      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-lg lg:text-xl font-serif"
        >
          Complete your profile
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          Add your name and photo so your team can recognize you.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        <Form {...form}>
          <form id="set-name-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-xs text-primary font-normal">
                    Full name
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="John Doe"
                      autoComplete="name"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
