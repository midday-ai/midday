import { Icons } from "@midday/ui/icons";
import { CopyInput } from "./copy-input";

export function InboxEmpty({ inboxId }) {
  return (
    <div className="h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="flex flex-col items-center w-[330px]">
        <Icons.InboxEmpty className="mb-4 w-[35px] h-[35px]" />
        <div className="text-center mb-6 space-y-2">
          <h2 className="font-medium text-lg">Magic Inbox</h2>
          <p className="text-[#606060] text-sm">
            Use this email for online purchases to seamlessly
            <br />
            match receipts againsts transactions.
          </p>
        </div>

        <CopyInput value={`${inboxId}@inbox.midday.ai`} />
      </div>
    </div>
  );
}
