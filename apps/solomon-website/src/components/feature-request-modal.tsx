"use client";

import { featureRequestAction } from "@/actions/feature-request-action";
import { featureRequestSchema } from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

const categories = ["Feature", "Integration", "API"];

export function FeatureRequestModal() {
  const [isSubmitted, setSubmitted] = useState(false);

  const featureRequest = useAction(featureRequestAction, {
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const form = useForm<z.infer<typeof featureRequestSchema>>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      email: "",
      title: "",
      description: "",
      category: "",
    },
  });

  return (
    <DialogContent className="sm:max-w-[500px]">
      <div className="p-4">
        {isSubmitted ? (
          <div className="text-center p-8 pb-12">
            <h2 className="font-semibold text-lg mb-4">Thank you</h2>

            <p className="text-sm">
              We'll inform you when your feature request is <br />
              ready for voting.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <DialogHeader>
              <DialogTitle>Request</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(featureRequest.execute)}
              className="space-y-4 mt-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} type="email" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Title" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => {
                            return (
                              <SelectItem value={category} key={category}>
                                {category}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="md:flex md:space-x-4 pt-4">
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 md:mt-0"
                  >
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button
                  type="submit"
                  disabled={featureRequest.status === "executing"}
                >
                  {featureRequest.status === "executing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Submit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </div>
    </DialogContent>
  );
}
