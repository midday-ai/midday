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

export function DeleteAccount() {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently remove your Personal Account and all of its contents from
          the Midday platform. This action is not reversible, so please continue
          with caution.
        </CardDescription>
      </CardHeader>
      {/* <CardContent>wef</CardContent> */}
      <CardFooter className="flex justify-between">
        <div />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="hover:bg-destructive">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
