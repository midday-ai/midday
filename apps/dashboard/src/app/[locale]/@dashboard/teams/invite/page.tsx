import { InviteForm } from "@/components/invite-form";
import { Icons } from "@midday/ui/icons";
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

          <InviteForm />
        </div>
      </div>
    </div>
  );
}
