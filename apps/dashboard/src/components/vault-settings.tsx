import { type UpdateTeamFormValues, updateTeamSchema } from "@/actions/schema";
import { updateTeamAction } from "@/actions/update-team-action";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@midday/ui/form";
import { SubmitButton } from "@midday/ui/submit-button";
import { Switch } from "@midday/ui/switch";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";

type Props = {
  documentClassification: boolean;
  onSuccess: () => void;
};

export function VaultSettings({ documentClassification, onSuccess }: Props) {
  const action = useAction(updateTeamAction, {
    onSuccess,
  });

  const form = useForm<UpdateTeamFormValues>({
    resolver: zodResolver(updateTeamSchema),
    defaultValues: {
      document_classification: documentClassification,
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    action.execute({ ...data, revalidatePath: "/vault" });
  });

  return (
    <div className="flex flex-col space-y-4">
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex flex-col">
          <FormField
            control={form.control}
            name="document_classification"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center w-full">
                  <FormLabel>Document classification</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  We use AI to classify your documents, enabling this will
                  automatically classify your documents into categories such as
                  contracts, invoices, etc.
                </FormDescription>
              </FormItem>
            )}
          />

          <SubmitButton
            isSubmitting={action.status === "executing"}
            className="w-full mt-8"
          >
            Save
          </SubmitButton>
        </form>
      </Form>
    </div>
  );
}
