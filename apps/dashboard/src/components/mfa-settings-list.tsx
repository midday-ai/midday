import { createClient } from "@midday/supabase/server";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { isLocalBackend } from "@midday/utils/backend";
import Link from "next/link";
import { LocalMfaSettingsList } from "./mfa-settings-list.local";
import { UnenrollMFA } from "./unenroll-mfa";

async function SupabaseMfaSettingsList() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const hasMfaFactors = data?.all && data.all.length > 0;

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
          <Button>{hasMfaFactors ? "Add new device" : "Enable MFA"}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export async function MfaSettingsList() {
  return isLocalBackend() ? (
    <LocalMfaSettingsList />
  ) : (
    <SupabaseMfaSettingsList />
  );
}
