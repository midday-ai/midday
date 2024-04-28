import { type UpdateTeamFormValues, updateTeamSchema } from "@/actions/schema";
import { updateTeamAction } from "@/actions/update-team-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { CopyInput } from "./copy-input";

type Props = {
  forwardEmail: string;
  inboxId: string;
  onSuccess: () => void;
};

export function InboxSettings({ forwardEmail, inboxId, onSuccess }: Props) {
  const action = useAction(updateTeamAction, {
    onSuccess,
  });

  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      inbox_email: forwardEmail,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    action.execute(data);
  });

  return (
    <div className="flex flex-col space-y-4">
      <CopyInput value={`${inboxId}.inbox@midday.ai`} />
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col">
          <FormField
            control={form.control}
            name="inbox_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forward email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(evt) =>
                      field.onChange(
                        evt.target.value.length > 0 ? evt.target.value : null
                      )
                    }
                    className="w-full"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    type="email"
                    placeholder="hello@example.com"
                  />
                </FormControl>
                <FormDescription>
                  We will send a copy of the emails to this address.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full mt-8">
            <Button
              type="submit"
              disabled={action.status === "executing"}
              className="w-full"
            >
              {action.status === "executing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
