import { Suspense } from "react";
import { MFAList, MFAListSkeleton } from "./mfa-list";

export function UnenrollMFA() {
  return (
    <Suspense fallback={<MFAListSkeleton />}>
      <MFAList />
    </Suspense>
  );
}
