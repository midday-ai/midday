"use client";

import { deleteTeamAction } from "@/actions/delete-team-action";
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
import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

export function DeleteTeam() {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete team</CardTitle>
        <CardDescription>
          Permanently remove your Team and all of its contents from the Vercel
          platform. This action is not reversible — please continue with
          caution.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between">
        <div />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="hover:bg-destructive text-muted"
            >
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                team and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => startTransition(() => deleteTeamAction())}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Continue"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
