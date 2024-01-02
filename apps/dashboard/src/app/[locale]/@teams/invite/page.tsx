import { getTeams } from "@midday/supabase/cached-queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import Link from "next/link";

export default async function InviteMembers() {
  return (
    <div>
      <header className="w-full absolute left-0 right-0">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.Logo />
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[340px] flex-col">
          <div>
            <h1 className="text-2xl font-medium mb-8">Invite Team Members</h1>
          </div>

          <div className="mb-2">
            <p className="text-sm">Invite new members by email address</p>
          </div>

          <div className="flex items-center justify-between mt-3 space-x-2">
            <Input
              placeholder="Ex: Acme Marketing or Acme Co"
              required
              autocomplete="off"
            />

            <Button variant="outline" className="font-normal">
              Member
            </Button>
          </div>

          <div className="flex items-center justify-between mt-8">
            <Button variant="ghost">Skip this step</Button>
            <Button>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
