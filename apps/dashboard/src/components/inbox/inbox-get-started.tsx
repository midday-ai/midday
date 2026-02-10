"use client";

import { getInboxEmail } from "@midday/inbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { revalidateInbox } from "@/actions/revalidate-action";
import { AppConnectionToast } from "@/components/app-connection-toast";
import { ConnectGmail } from "@/components/inbox/connect-gmail";
import { ConnectOutlook } from "@/components/inbox/connect-outlook";
import { ConnectSlack } from "@/components/inbox/connect-slack";
import { ConnectWhatsApp } from "@/components/inbox/connect-whatsapp";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { CopyInput } from "../copy-input";
import { UploadZone } from "./inbox-upload-zone";

export function InboxGetStarted() {
  const { data: user } = useUserQuery();
  const { setParams } = useInboxParams();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const router = useRouter();

  const handleUpload = async (inboxId?: string) => {
    // Invalidate client-side queries
    await queryClient.invalidateQueries({
      queryKey: trpc.inbox.get.infiniteQueryKey(),
    });

    // Revalidate server-side cache
    await revalidateInbox();

    // Navigate to inbox
    if (inboxId) {
      setParams({ inboxId });
    }
  };

  // Listen for new inbox items via realtime subscription
  // When a webhook creates an inbox item, detect it and refresh the page
  useRealtime({
    channelName: "realtime_inbox_get_started",
    events: ["INSERT"],
    table: "inbox",
    filter: user?.teamId ? `team_id=eq.${user.teamId}` : undefined,
    onEvent: async (payload) => {
      if (payload.eventType === "INSERT") {
        // Invalidate client-side queries
        await queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        // Revalidate server-side cache
        await revalidateInbox();

        // Refresh the router to trigger server component re-render
        // This will cause the page to check data again and switch to InboxView
        router.refresh();

        // If the new item has an ID, navigate to it
        const newItem = payload.new as { id?: string };
        if (newItem?.id) {
          setParams({ inboxId: newItem.id });
        }
      }
    },
  });

  return (
    <UploadZone onUploadComplete={handleUpload}>
      <AppConnectionToast />
      <div className="h-[calc(100vh-150px)] flex items-center justify-center">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4 text-center">
              <h2 className="font-medium text-lg">Connect Your Inbox</h2>
              <p className="pb-6 text-sm text-[#878787]">
                Connect your email or messaging apps to automatically import
                receipts and invoices. We'll extract the data and match it to
                your transactions.
              </p>
            </div>

            <div className="pointer-events-auto flex flex-col space-y-4">
              <ConnectGmail />
              <ConnectOutlook />

              <Accordion
                type="single"
                collapsible
                className="border-t-[1px] pt-2 mt-6"
              >
                <AccordionItem value="item-1" className="border-0">
                  <AccordionTrigger className="justify-center space-x-2 flex text-sm">
                    <span>More options</span>
                  </AccordionTrigger>
                  <AccordionContent className="mt-4">
                    <div className="flex flex-col space-y-4">
                      <ConnectSlack />
                      <ConnectWhatsApp />
                      {user?.team?.inboxId && (
                        <CopyInput value={getInboxEmail(user.team.inboxId)} />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="text-center mt-8">
              <p className="text-xs text-[#878787]">
                You can also just drag and drop files here for automatic
                reconciliation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </UploadZone>
  );
}
