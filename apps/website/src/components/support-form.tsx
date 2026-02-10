"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { sendSupportSchema } from "@/actions/schema";
import { sendSupportAction } from "@/actions/send-support-action";

export function SupportForm() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof sendSupportSchema>>({
    resolver: zodResolver(sendSupportSchema),
    defaultValues: {
      email: "",
      fullName: "",
      subject: "",
      type: "",
      priority: "",
      message: "",
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
        title: "Something went wrong pleaase try again.",
      });
    },
  });

  return (
    <div className="pt-32 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">
            Support
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-relaxed">
            Get help with Midday. Contact our team for assistance with any
            questions or issues you may have.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(sendSupport.execute)}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-sans text-sm">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-sans text-sm">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans text-sm">Subject</FormLabel>
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

            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="font-sans text-sm">Product</FormLabel>
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
                        <SelectItem value="Transactions">
                          Transactions
                        </SelectItem>
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
                    <FormLabel className="font-sans text-sm">
                      Severity
                    </FormLabel>
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
                  <FormLabel className="font-sans text-sm">Message</FormLabel>
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

            <Button type="submit" disabled={sendSupport.status === "executing"}>
              {sendSupport.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
