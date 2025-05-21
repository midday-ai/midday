"use client";

// import { ConnectGmail } from "@/components/inbox/connect-gmail";
import { useUserQuery } from "@/hooks/use-user";
import { getInboxEmail } from "@midday/inbox";
import { useRouter } from "next/navigation";
import { CopyInput } from "../copy-input";
import { UploadZone } from "./inbox-upload-zone";

export function InboxGetStarted() {
  const { data: user } = useUserQuery();
  const router = useRouter();

  const handleUpload = () => {
    router.push("/inbox?connected=true", { scroll: false });
  };

  return (
    <UploadZone onUploadComplete={handleUpload}>
      <div className="h-[calc(100vh-150px)] flex items-center justify-center">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4 text-center">
              <h2 className="font-medium text-lg">Magic Inbox</h2>
              <p className="pb-6 text-sm text-[#878787]">
                Use the email to send receipts to Midday. We will extract and
                reconcile them against your transactions. Additionally, you can
                also upload receipts by simply dragging and dropping them here.
              </p>
            </div>

            {/* <p className="pb-6 text-sm text-[#878787]">
              Connect your email, forward receipts to your Midday inbox, or drag
              and drop them here. We'll automatically extract and match the
              data.
            </p> */}

            <div className="pointer-events-auto flex flex-col space-y-4">
              {/* <ConnectGmail /> */}
              {/* <ConnectOutlook /> */}

              {user?.team?.inboxId && (
                <div className="flex flex-col space-y-4">
                  <CopyInput value={getInboxEmail(user.team.inboxId)} />
                </div>
                // <Accordion
                //   type="single"
                //   collapsible
                //   className="border-t-[1px] pt-2 mt-6"
                // >
                //   <AccordionItem value="item-1" className="border-0">
                //     <AccordionTrigger className="justify-center space-x-2 flex text-sm">
                //       <span>More options</span>
                //     </AccordionTrigger>
                //     <AccordionContent className="mt-4">
                //       <div className="flex flex-col space-y-4">
                //         <CopyInput value={getInboxEmail(user.team.inbox_id)} />
                //       </div>
                //     </AccordionContent>
                //   </AccordionItem>
                // </Accordion>
              )}

              {/* <p className="text-xs text-[#878787]">
                We automatically sync and process PDF attachments from your
                email multiple times per day to keep your inbox current.
              </p> */}
            </div>
          </div>
        </div>
      </div>
    </UploadZone>
  );
}
