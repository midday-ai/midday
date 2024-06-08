import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import Link from "next/link";
import { UnenrollMFA } from "./unenroll-mfa";

export function MfaSettingsList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-factor authentication</CardTitle>
        <CardDescription>
          Add an additional layer of security to your account by requiring more
          than just a password to sign in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <UnenrollMFA />
      </CardContent>

      <CardFooter className="flex justify-between">
        <div />
        <Link href="?add=device">
          <Button>Add new device</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
