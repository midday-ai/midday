import { deleteBankAccountAction } from "@/actions/delete-bank-account-action";
import { updateBankAccountAction } from "@/actions/update-bank-account-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Account Name must be at least 1 characters.",
  }),
});

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  defaultValue: string;
};

export function EditBankAccountModal({
  id,
  onOpenChange,
  isOpen,
  defaultValue,
}: Props) {
  const deleteAccount = useAction(deleteBankAccountAction, {
    onSuccess: () => onOpenChange(false),
  });

  const updateAccount = useAction(updateBankAccountAction, {
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValue,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateAccount.execute({ id, ...values });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle className="flex justify-between">
              <span>Edit Account</span>
              <DropdownMenu>
                <DropdownMenuTrigger className="mr-8 -mt-[5px]">
                  <MoreHorizontal size={20} />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="text-[#F84E4E]"
                    onClick={() => deleteAccount.execute({ id })}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 mb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        autoFocus
                        placeholder="Company Account"
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

              <DialogFooter className="mt-12 w-full">
                <div className="space-y-4 w-full">
                  <Button
                    disabled={updateAccount.status === "executing"}
                    className="w-full"
                    type="submit"
                  >
                    {updateAccount.status === "executing" ? (
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
