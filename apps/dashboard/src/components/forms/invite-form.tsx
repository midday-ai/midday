"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useFieldArray } from "react-hook-form";
import { z } from "zod/v3";

const formSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(["owner", "member"]),
    }),
  ),
});

type InviteFormProps = {
  onSuccess?: () => void;
  skippable?: boolean;
};

export function InviteForm({ onSuccess, skippable = true }: InviteFormProps) {
  const t = useI18n();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const inviteMutation = useMutation(
    trpc.team.invite.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.team.teamInvites.queryKey(),
        });

        // Show appropriate feedback based on results
        if (data.sent > 0 && data.skipped === 0) {
          toast({
            title: t("modals.invite.sent"),
            description: t("modals.invite.sent_count", { count: data.sent }),
            variant: "success",
          });
        } else if (data.sent > 0 && data.skipped > 0) {
          toast({
            title: t("modals.invite.partially_sent"),
            description: `${t("modals.invite.sent_count", { count: data.sent })}, ${t("modals.invite.skipped", { count: data.skipped })}`,
          });
        } else if (data.sent === 0 && data.skipped > 0) {
          toast({
            title: t("modals.invite.no_sent"),
            description: t("modals.invite.skipped", { count: data.skipped }),
          });
        }

        onSuccess?.();
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      invites: [
        {
          email: "",
          role: "member",
        },
      ],
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    inviteMutation.mutate(data.invites.filter((invite) => invite.email !== ""));
  });

  const { fields, append } = useFieldArray({
    name: "invites",
    control: form.control,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        {fields.map((field, index) => (
          <div
            className="flex items-center justify-between mt-3 space-x-4"
            key={index.toString()}
          >
            <FormField
              control={form.control}
              key={field.id}
              name={`invites.${index}.email`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder={t("forms.placeholders.email")}
                      type="email"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`invites.${index}.role`}
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="min-w-[120px]">
                        <SelectValue placeholder={t("team.select_role")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">{t("team.owner")}</SelectItem>
                      <SelectItem value="member">{t("team.member")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ))}

        <Button
          variant="outline"
          type="button"
          className="mt-4 border-none bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D]"
          onClick={() => append({ email: "", role: "member" })}
        >
          {t("forms.buttons.add_more")}
        </Button>

        <div className="border-t-[1px] pt-4 mt-8 items-center justify-between">
          <div>
            {Object.values(form.formState.errors).length > 0 && (
              <span className="text-sm text-destructive">
                {t("forms.validation.complete_fields")}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {skippable ? (
              <Link href="/">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-normal"
                >
                  {t("forms.buttons.skip")}
                </Button>
              </Link>
            ) : (
              <div />
            )}

            <SubmitButton
              type="submit"
              isSubmitting={inviteMutation.isPending}
              disabled={inviteMutation.isPending}
            >
              {t("modals.invite.send_invites")}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
