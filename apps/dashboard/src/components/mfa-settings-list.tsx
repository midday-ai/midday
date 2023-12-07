import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { Suspense } from "react";
import { ErrorFallback } from "./error-fallback";
import { UnenrollMFA } from "./unenroll-mfa";

export async function MfaSettingsList() {
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
        {/* <ErrorBoundary errorComponent={ErrorFallback}> */}
        {/* <Suspense fallback={<NotificationSettingsSkeleton />}> */}
        {/* <NotificationSettings /> */}
        {/* </Suspense> */}
        {/* </ErrorBoundary> */}
      </CardContent>
    </Card>
  );
}
