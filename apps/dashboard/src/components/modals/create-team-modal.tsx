import { createTeamAction } from "@/actions/create-team-action";
import { createTeamSchema } from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
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
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import type { z } from "zod";

type Props = {
  onOpenChange: (isOpen: boolean) => void;
};

export function CreateTeamModal({ onOpenChange }: Props) {
  const createTeam = useAction(createTeamAction, {
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm<z.infer<typeof createTeamSchema>>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      redirectTo: "/",
    },
  });

  function onSubmit(values: z.infer<typeof createTeamSchema>) {
    createTeam.execute({ name: values.name });
  }

  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4">
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            For example, you can use the name of your company or department.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      autoFocus
                      className="mt-3"
                      placeholder="Ex: Acme Marketing or Acme Co"
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

            <div className="mt-6 mb-6">
              <DialogFooter>
                <div className="space-x-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTeam.status === "executing"}
                  >
                    {createTeam.status === "executing" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </div>
    </DialogContent>
  );
}
