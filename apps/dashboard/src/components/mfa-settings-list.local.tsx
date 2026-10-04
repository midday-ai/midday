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
import { getFreshSession } from "@/lib/auth";
import { UnenrollMFA } from "./unenroll-mfa";

export async function LocalMfaSettingsList() {
  const session = await getFreshSession();
  const hasMfaFactors = !!session?.user.twoFactorEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multi-factor authentication</CardTitle>
        <CardDescription>
          Add an additional layer of security to your account by requiring an
          authenticator code after signing in.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {hasMfaFactors && <UnenrollMFA />}
        {!hasMfaFactors && (
          <p className="text-sm text-[#606060]">
            Multi-factor authentication is not enabled. Enable it to add an
            additional layer of security to your account.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div />
        <Link href="?add=device">
          <Button>
            {hasMfaFactors ? "Replace authenticator" : "Enable MFA"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
