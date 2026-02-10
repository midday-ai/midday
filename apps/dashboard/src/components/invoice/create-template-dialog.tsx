"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import { z } from "zod/v3";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (template: { id: string; name: string }) => void;
};

export function CreateTemplateDialog({ open, onOpenChange, onCreated }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const invoiceForm = useFormContext();

  const form = useZodForm(formSchema, {
    defaultValues: {
      name: "",
    },
  });

  const createTemplateMutation = useMutation(
    trpc.invoiceTemplate.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceTemplate.count.queryKey(),
        });

        if (data) {
          onCreated?.({ id: data.id, name: data.name });
        }

        form.reset();
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Failed to create template",
          variant: "error",
        });
      },
    }),
  );

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Get current template settings from invoice form to copy to new template
    const currentTemplate = invoiceForm?.getValues("template");

    // Get the CURRENT invoice-level details (editors modify these, not template.*)
    // This ensures user's edits are captured, not stale template values
    const fromDetails = invoiceForm?.getValues("fromDetails");
    const paymentDetails = invoiceForm?.getValues("paymentDetails");
    const noteDetails = invoiceForm?.getValues("noteDetails");

    // Exclude id from current template since we're creating a new one
    const { id: _id, ...templateSettings } = currentTemplate || {};

    createTemplateMutation.mutate({
      ...templateSettings,
      // Override with current invoice-level values to capture user's edits
      fromDetails: fromDetails ? JSON.stringify(fromDetails) : null,
      paymentDetails: paymentDetails ? JSON.stringify(paymentDetails) : null,
      noteDetails: noteDetails ? JSON.stringify(noteDetails) : null,
      name: values.name,
      isDefault: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new invoice template to customize your invoices.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="mt-6 space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="e.g., Standard, Consulting, Retainer"
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <SubmitButton
                  type="submit"
                  isSubmitting={createTemplateMutation.isPending}
                >
                  Create
                </SubmitButton>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
