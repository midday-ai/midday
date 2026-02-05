"use client";

import { signInWithPasswordAction } from "@/actions/sign-in-with-password-action";
import { signUpWithPasswordAction } from "@/actions/sign-up-with-password-action";
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
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Props = {
  className?: string;
};

export function EmailPasswordSignIn({ className }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  const signIn = useAction(signInWithPasswordAction, {
    onError: ({ error }) => {
      setErrorMessage(error.serverError || "Failed to sign in");
    },
  });

  const signUp = useAction(signUpWithPasswordAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        setSuccessMessage(data.message);
        setErrorMessage(null);
      }
    },
    onError: ({ error }) => {
      setErrorMessage(error.serverError || "Failed to create account");
    },
  });

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSignIn = (values: z.infer<typeof signInSchema>) => {
    setErrorMessage(null);
    signIn.execute({
      ...values,
      redirectTo: `${window.location.origin}/${returnTo || ""}`,
    });
  };

  const onSignUp = (values: z.infer<typeof signUpSchema>) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    signUp.execute(values);
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setErrorMessage(null);
    setSuccessMessage(null);
    signInForm.reset();
    signUpForm.reset();
  };

  if (successMessage) {
    return (
      <div className={cn("flex flex-col space-y-4 items-center", className)}>
        <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccessMessage(null);
            setMode("signin");
          }}
          className="text-sm text-primary underline font-medium"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <Form key="signup" {...signUpForm}>
        <form
          onSubmit={signUpForm.handleSubmit(onSignUp)}
          className="w-full"
        >
          <div className={cn("flex flex-col space-y-4", className)}>
            <FormField
              control={signUpForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Email address"
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

            <FormField
              control={signUpForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signUpForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Confirm password"
                      type="password"
                      {...field}
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
              isSubmitting={signUp.isExecuting}
            >
              Create account
            </SubmitButton>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-[#878787] hover:text-foreground transition-colors"
              >
                Already have an account?{" "}
                <span className="text-primary underline">Sign in</span>
              </button>
            </div>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form key="signin" {...signInForm}>
      <form onSubmit={signInForm.handleSubmit(onSignIn)} className="w-full">
        <div className={cn("flex flex-col space-y-4", className)}>
          <FormField
            control={signInForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Email address"
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

          <FormField
            control={signInForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-[#878787] hover:text-foreground transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <SubmitButton
            type="submit"
            className="bg-primary px-6 py-4 text-secondary font-medium flex space-x-2 h-[40px] w-full"
            isSubmitting={signIn.isExecuting}
          >
            Sign in
          </SubmitButton>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-[#878787] hover:text-foreground transition-colors"
            >
              Don't have an account?{" "}
              <span className="text-primary underline">Create one</span>
            </button>
          </div>
        </div>
      </form>
    </Form>
  );
}
