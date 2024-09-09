"use client";

import { createReportAction } from "@/actions/report/create-report-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { useToast } from "@midday/ui/use-toast";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CopyInput } from "./copy-input";

const formSchema = z.object({
  expireAt: z.date().optional(),
});

type Props = {
  defaultValue: {
    from: string;
    to: string;
  };
  type: "profit" | "revenue";
  setOpen: (open: boolean) => void;
};

export function ShareReport({ defaultValue, type, setOpen }: Props) {
  const { toast, dismiss } = useToast();

  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? defaultValue.from;
  const to = searchParams?.get("to") ?? defaultValue.to;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    createReport.execute({
      baseUrl: window.location.origin,
      from,
      to,
      type,
      expiresAt: data.expireAt && new Date(data.expireAt).toISOString(),
    });
  }

  const createReport = useAction(createReportAction, {
    onError: () => {
      toast({
        duration: 2500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
    onSuccess: ({ data }) => {
      setOpen(false);

      const { id } = toast({
        title: "Report published",
        description: "Your report is ready to share.",
        variant: "success",
        footer: (
          <div className="mt-4 space-x-2 flex w-full">
            <CopyInput
              value={data.short_link}
              className="border-[#2C2C2C] w-full"
            />

            <Link href={data.short_link} onClick={() => dismiss(id)}>
              <Button>View</Button>
            </Link>
          </div>
        ),
      });
    },
  });

  return (
    <DialogContent className="sm:max-w-[425px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-8">
          <DialogHeader>
            <DialogTitle>Share report</DialogTitle>
            <DialogDescription>
              Share a report from the period.
            </DialogDescription>
          </DialogHeader>

          <FormField
            control={form.control}
            name="expireAt"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline">
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Expire at</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  A date when the report link will expire.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={createReport.status === "executing"}
              className="w-full"
            >
              {createReport.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
