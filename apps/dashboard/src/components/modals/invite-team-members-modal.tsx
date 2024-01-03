"use client";

import { inviteTeamMembersAction } from "@/actions/invite-team-members-action";
import {
  InviteTeamMembersFormValues,
  inviteTeamMembersSchema,
} from "@/actions/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useFieldArray, useForm } from "react-hook-form";

export function InviteTeamMembersModal() {
  const inviteMembers = useAction(inviteTeamMembersAction);

  const form = useForm<InviteTeamMembersFormValues>({
    resolver: zodResolver(inviteTeamMembersSchema),
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
    inviteMembers.execute({
      // Remove invites without email (last appended invite validation)
      invites: data.invites.filter((invite) => invite.email !== undefined),
    });
  });

  const { fields, append } = useFieldArray({
    name: "invites",
    control: form.control,
  });

  return (
    <DialogContent className="max-w-[455px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="p-4">
            <DialogHeader>
              <DialogTitle>Invite Members</DialogTitle>
              <DialogDescription>
                Invite new members by email address.
              </DialogDescription>
            </DialogHeader>

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
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder="jane@example.com"
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

                <Button variant="outline" className="font-normal">
                  Member
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              type="button"
              className="mt-4 space-x-1"
              onClick={() => append({ email: undefined, role: "member" })}
            >
              <Icons.Add />
              <span>Add more</span>
            </Button>
            <DialogFooter className="border-t-[1px] pt-4 mt-8 items-center !justify-between">
              <div>
                {Object.values(form.formState.errors).length > 0 && (
                  <span className="text-sm text-destructive">
                    Please complete the fields above.
                  </span>
                )}
              </div>
              <Button
                type="submit"
                disabled={inviteMembers.status === "executing"}
              >
                {inviteMembers.status === "executing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Invite"
                )}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}
