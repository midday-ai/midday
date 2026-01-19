"use client";

import { resetPasswordAction } from "@/actions/reset-password-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@midday/ui/cn";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type Props = {
  className?: string;
};

export function ForgotPasswordForm({ className }: Props) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetPassword = useAction(resetPasswordAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setSuccessMessage(data.message);
        setErrorMessage(null);
      }
    },
    onError: ({ error }) => {
      setErrorMessage(error.serverError || "Failed to send reset email");
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    resetPassword.execute(values);
  };

  if (successMessage) {
    return (
      <div className={cn("flex flex-col space-y-4 items-center", className)}>
        <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-primary underline font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
        <div className={cn("flex flex-col space-y-4", className)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter your email address"
                    type="email"
                    {...field}
                    autoCapitalize="false"
                    autoCorrect="false"
                    spellCheck="false"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <SubmitButton
            type="submit"
            className="bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
            isSubmitting={resetPassword.isExecuting}
          >
            Send reset link
          </SubmitButton>

          <div className="flex justify-center">
            <Link
              href="/login"
              className="text-sm text-[#878787] hover:text-foreground transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </form>
    </Form>
  );
}
