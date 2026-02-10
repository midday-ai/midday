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
import { useTRPC } from "@/trpc/client";

type UpgradeContentProps = {
  user: {
    fullName: string | null;
  };
};

export function UpgradeContent({ user }: UpgradeContentProps) {
  const firstName = user.fullName ? user.fullName.split(" ").at(0) : "";
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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] md:py-12 md:-ml-8">
      <div className="w-full max-w-[696px] p-8">
        <div className="mb-8 md:mt-8">
          <h1 className="text-xl font-semibold leading-none tracking-tight mb-2">
            Unlock full access to Midday
          </h1>
          <p className="text-sm text-muted-foreground">
            {firstName ? `Hi ${firstName}, ` : ""}You've been using Midday for
            14 days. Your trial has ended—choose a plan to continue using all of
            Midday's features.
          </p>
        </div>

        <Plans />

        <p className="text-xs text-muted-foreground mt-6 text-center">
          Don't want to continue?{" "}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="hover:underline">
                delete your account
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
  );
}
