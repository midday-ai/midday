import { Skeleton } from "@midday/ui/skeleton";
import { getFreshSession } from "@/lib/auth";
import { RemoveMFAButton } from "./remove-mfa-button";

export function LocalMFAListSkeleton() {
  return (
    <div className="flex justify-between items-center h-[36px]">
      <Skeleton className="h-4 w-[200px]" />
    </div>
  );
}

export async function LocalMFAList() {
  const session = await getFreshSession();
  if (!session?.user.twoFactorEnabled) return null;
  return (
    <div className="flex justify-between items-center space-y-4">
      <div>
        <p className="text-sm">Authenticator app</p>
        <p className="text-xs text-[#606060] mt-0.5">Verified</p>
      </div>
      <RemoveMFAButton />
    </div>
  );
}
