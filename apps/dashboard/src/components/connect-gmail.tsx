import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function ConnectGmail() {
  return (
    <div className="py-6 px-8 max-w-[900px] flex items-between opacity-50">
      <div className="flex-1">
        <h2 className="mb-2">Connect Gmail</h2>
        <p className="text-sm text-[#B0B0B0]">
          With Gmail read-only mail extraction we can match invoices to <br />
          transactions for a automated process.
        </p>

        <div className="mt-8 space-x-2 items-center flex">
          <Button disabled className="space-x-2">
            <Icons.Google />
            <span>Connect</span>
          </Button>
          <Button disabled variant="ghost">
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
