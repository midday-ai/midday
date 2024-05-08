import {
  type UpdateCategoriesFormValues,
  updateCategorySchema,
} from "@/actions/schema";
import { updateCategoryAction } from "@/actions/update-category-action";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@midday/ui/form";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { InputColor } from "../input-color";

type Props = {
  id: string;
  onOpenChange: (isOpen: boolean) => void;
  isOpen: boolean;
  defaultValue: { name: string; color: string };
};

export function EditCategoryModal({
  id,
  onOpenChange,
  isOpen,
  defaultValue,
}: Props) {
  const updateCategory = useAction(updateCategoryAction, {
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm<UpdateCategoriesFormValues>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      revalidatePath: "/settings/categories",
      id,
      name: defaultValue.name,
      color: defaultValue.color,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[455px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(updateCategory.execute)}
              className="mt-6 mb-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <div
                          className="size-3 transition-colors rounded-[2px] absolute top-3 left-2"
                          style={{
                            backgroundColor: form.watch("color"),
                          }}
                        />

                        <InputColor
                          placeholder="Category"
                          onChange={({ name, color }) => {
                            form.setValue("color", color);
                            field.onChange(name);
                          }}
                          defaultValue={field.value}
                          defaultColor={form.watch("color")}
                        />

                        <FormMessage />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-12 w-full">
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
