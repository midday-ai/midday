import { joinTeamByInviteCode } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { revalidateTag } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Join team | Midday",
};

export default async function InviteCode({ params }) {
  const supabase = createClient();
  const { code } = params;

  if (code) {
    const user = await joinTeamByInviteCode(supabase, code);

    if (user) {
      revalidateTag(`user_${user.id}`);
      revalidateTag(`teams_${user.id}`);
      redirect("/");
    }
  }

  return (
    <div>
      <div className="absolute left-5 top-4 md:left-10 md:top-10">
        <Link href="/">
          <Icons.Logo />
        </Link>
      </div>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4">
              <h1 className="font-medium pb-1 text-3xl">
                Invite link has expired
              </h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#606060]">
              Notify the sender for a new one.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-4">
              <Link href="/" className="w-full">
                <Button className="w-full">Go to teams</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
