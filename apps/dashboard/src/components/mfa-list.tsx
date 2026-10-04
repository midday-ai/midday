import { createClient } from "@midday/supabase/server";
import { Skeleton } from "@midday/ui/skeleton";
import { isLocalBackend } from "@midday/utils/backend";
import { format } from "date-fns";
import { getI18n } from "@/locales/server";
import { LocalMFAList } from "./mfa-list.local";
import { RemoveMFAButton } from "./remove-mfa-button";

export function MFAListSkeleton() {
  return (
    <div className="flex justify-between items-center h-[36px]">
      <Skeleton className="h-4 w-[200px]" />
    </div>
  );
}

async function SupabaseMFAList() {
  const supabase = await createClient();

  const { data } = await supabase.auth.mfa.listFactors();
  const t = await getI18n();

  return data?.all
    ?.sort((a) => (a.status === "verified" ? -1 : 1))
    .map((factor) => {
      return (
        <div
          key={factor.id}
          className="flex justify-between items-center space-y-4"
        >
          <div>
            <p className="text-sm">
              Added on {format(new Date(factor.created_at), "pppp")}
            </p>

            <p className="text-xs text-[#606060] mt-0.5">
              {t(`mfa_status.${factor.status}`)}
            </p>
          </div>

          <RemoveMFAButton factorId={factor.id} />
        </div>
      );
    });
}

export async function MFAList() {
  return isLocalBackend() ? <LocalMFAList /> : <SupabaseMFAList />;
}
