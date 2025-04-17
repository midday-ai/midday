"use client";

import { ConnectGmail } from "@/components/inbox/connect-gmail";
import { ConnectOutlook } from "@/components/inbox/connect-outlook";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { getInboxEmail } from "@midday/inbox";
import { useRouter } from "next/navigation";
import { CopyInput } from "../copy-input";

export function InboxGetStarted() {
  const router = useRouter();
  const { data: user } = useUserQuery();

  useRealtime({
    channelName: "realtime_inbox",
    table: "inbox",
    filter: `team_id=eq.${user?.team_id}`,
    onEvent: (payload) => {
      if (payload.eventType === "INSERT") {
        router.push("/inbox");
      }
    },
  });

  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
        <div className="flex w-full flex-col relative">
          <div className="pb-4">
            <h2 className="font-medium text-lg">Magic Inbox</h2>
          </div>

          <p className="pb-6 text-sm text-[#878787]">
            Connect your email, forward receipts to your Midday inbox, or drag
            and drop them here. We'll automatically extract and match the data.
          </p>

          <div className="pointer-events-auto flex flex-col space-y-4">
            <ConnectGmail />
            <ConnectOutlook />

            {user?.team?.inbox_id && (
              <div className="border-t-[1px] pt-2 mt-2">
                <div className="flex flex-col space-y-4 mt-4">
                  <CopyInput value={getInboxEmail(user.team.inbox_id)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
