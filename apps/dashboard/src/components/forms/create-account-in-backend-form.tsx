"use client";

import { onboardAccountToBackendAction, onboardAccountToBackendSchema } from "@/actions/solomon-backend/onboard-to-backend";
import { generateRandomString } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import type { z } from "zod";

/**
 * CreateAccountInBackendForm Component
 * 
 * This component renders a form for creating an account in the backend system.
 * It uses react-hook-form for form management and zod for schema validation.
 * 
 * @component
 * @example
 * ```tsx
 * <CreateAccountInBackendForm />
 * ```
 */
export function CreateAccountInBackendForm(props: {
    onSuccess?: () => void;
}) {
    const { onSuccess } = props;
    // Use the onboardAccountToBackendAction with next-safe-action
    const onboardToBackend = useAction(onboardAccountToBackendAction);

    /**
     * Initialize the form using react-hook-form
     * @type {UseFormReturn<z.infer<typeof onboardAccountToBackendSchema>>}
     */
    const form = useForm<z.infer<typeof onboardAccountToBackendSchema>>({
        resolver: zodResolver(onboardAccountToBackendSchema),
        defaultValues: {
            username: "",
        },
    });

    /**
     * Handle form submission
     * @param {z.infer<typeof onboardAccountToBackendSchema>} values - The form values
     */
    function onSubmit(values: z.infer<typeof onboardAccountToBackendSchema>) {
        onboardToBackend.execute({ username: values.username });
        onSuccess?.();
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    autoFocus
                                    className="mt-3 rounded-2xl"
                                    placeholder={generateRandomString(10)}
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

                <Button
                    className="mt-6 w-fit"
                    type="submit"
                    disabled={onboardToBackend.status === "executing"}
                >
                    {onboardToBackend.status === "executing" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        "Create Username"
                    )}
                </Button>
            </form>
        </Form>
    );
}
