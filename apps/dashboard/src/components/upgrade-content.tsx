"use client";

import { createClient } from "@midday/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plans } from "@/components/plans";
import { UpgradeFAQ } from "@/components/upgrade-faq";
import { useTRPC } from "@/trpc/client";

type UpgradeContentProps = {
  user: {
    fullName: string | null;
  };
  continent?: string;
};

export function UpgradeContent({ user, continent }: UpgradeContentProps) {
  const supabase = createClient();
  const trpc = useTRPC();
  const router = useRouter();
  const [deleteValue, setDeleteValue] = useState("");

  const deleteUserMutation = useMutation(
    trpc.user.delete.mutationOptions({
      onSuccess: async () => {
        await supabase.auth.signOut();
        router.push("/");
      },
    }),
  );

  const firstName = user.fullName ? user.fullName.split(" ").at(0) : null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] md:py-6 md:-ml-8">
      <div className="w-full max-w-[960px] p-8">
        <div className="mb-8 md:mt-8 text-center">
          <h1 className="font-serif text-2xl text-foreground mb-2">
            {firstName
              ? `${firstName}, your data is waiting for you`
              : "Your data is waiting for you"}
          </h1>
          <p className="font-sans text-base text-muted-foreground leading-normal max-w-lg mx-auto">
            Your trial has ended — pick a plan to continue.
          </p>
        </div>

        <Plans continent={continent} />

        <UpgradeFAQ />

        <div className="mt-24 text-center">
          <p className="text-xs text-muted-foreground/30">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="hover:underline">
                  Delete account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex flex-col gap-2 mt-2">
                  <Label htmlFor="confirm-delete">
                    Type <span className="font-medium">DELETE</span> to confirm.
                  </Label>
                  <Input
                    id="confirm-delete"
                    value={deleteValue}
                    onChange={(e) => setDeleteValue(e.target.value)}
                  />
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteUserMutation.mutate()}
                    disabled={
                      deleteValue !== "DELETE" || deleteUserMutation.isPending
                    }
                  >
                    {deleteUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Continue"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </p>
        </div>
      </div>
    </div>
  );
}
