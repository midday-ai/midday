"use client";

import { sendSupportAction } from "@/actions/send-support-action";
import { useZodForm } from "@/hooks/use-zod-form";
import { Button } from "@midday/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { z } from "zod";

const formSchema = z.object({
  subject: z.string(),
  priority: z.string(),
  type: z.string(),
  message: z.string(),
  url: z.string().optional(),
});

export function SupportForm() {
  const { toast } = useToast();

  const form = useZodForm(formSchema, {
    defaultValues: {
      subject: undefined,
      type: undefined,
      priority: undefined,
      message: undefined,
    },
  });

  const sendSupport = useAction(sendSupportAction, {
    onSuccess: () => {
      toast({
        duration: 2500,
        title: "Support ticket sent.",
        variant: "success",
      });

      form.reset();
    },
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(sendSupport.execute)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input
                  placeholder="Summary of the problem you have"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Product</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Transactions">Transactions</SelectItem>
                    <SelectItem value="Vault">Vault</SelectItem>
                    <SelectItem value="Inbox">Inbox</SelectItem>
                    <SelectItem value="Invoicing">Invoicing</SelectItem>
                    <SelectItem value="Tracker">Tracker</SelectItem>
                    <SelectItem value="AI">AI</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Severity</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                  className="resize-none min-h-[150px]"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={
            sendSupport.status === "executing" || !form.formState.isValid
          }
        >
          {sendSupport.status === "executing" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
}
