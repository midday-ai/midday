"use client";

import { updateUserSchema } from "@/actions/schema";
import { updateUserAction } from "@/actions/update-user-action";
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
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AvatarUpload } from "./avatar-upload";

type Props = {
  userId: string;
  avatarUrl?: string;
  fullName?: string;
};

export function SetupForm({ userId, avatarUrl, fullName }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);

  const updateUser = useAction(updateUserAction, {
    onError: () => {
      toast({
        duration: 3500,
        variant: "error",
        title: "Something went wrong please try again.",
      });
    },
    onSuccess: () => {
      router.replace("/");
    },
  });

  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: fullName ?? "",
    },
  });

  const isSubmitting =
    updateUser.status !== "idle" && updateUser.status !== "hasErrored";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(updateUser.execute)}
        className="space-y-8"
      >
        <div className="flex justify-between items-end gap-4">
          <AvatarUpload
            userId={userId}
            avatarUrl={avatarUrl}
            fullName={fullName}
            size={80}
            ref={uploadRef}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => uploadRef.current?.click()}
          >
            Upload
          </Button>
        </div>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>
                This is your first and last name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Save</span>
          )}
        </Button>
      </form>
    </Form>
  );
}
