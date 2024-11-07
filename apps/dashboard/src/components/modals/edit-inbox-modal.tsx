import { updateInboxAction } from "@/actions/inbox/update";
import {
  type UpdateInboxFormValues,
  updateInboxSchema,
} from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SelectCurrency } from "../select-currency";

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  currencies: string[];
  defaultValue: {
    display_name: string;
    amount: string;
    currency: string;
  };
};

export function EditInboxModal({
  id,
  onOpenChange,
  isOpen,
  defaultValue,
  currencies,
}: Props) {
  const updateCategory = useAction(updateInboxAction, {
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm<UpdateInboxFormValues>({
    resolver: zodResolver(updateInboxSchema),
  });

  useEffect(() => {
    form.reset({
      id,
      display_name: defaultValue.display_name,
      amount: defaultValue.amount?.toString(),
      currency: defaultValue.currency ?? undefined,
    });
  }, [id]);

  function onSubmit(values: UpdateInboxFormValues) {
    updateCategory.execute(values);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 mb-6">
              <div className="flex flex-col space-y-2">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...field} placeholder="Name" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex flex-row space-x-2">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Input {...field} placeholder="Amount" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <SelectCurrency
                            className="w-full text-xs"
                            {...field}
                            currencies={Object.values(currencies)?.map(
                              (currency) => currency,
                            )}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="mt-8 w-full">
                <div className="space-y-4 w-full">
                  <Button
                    disabled={updateCategory.status === "executing"}
                    className="w-full"
                    type="submit"
                  >
                    {updateCategory.status === "executing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
