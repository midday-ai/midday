import { SelectTeamTable } from "@/components/tables/select-team/table";
import { TeamInvites } from "@/components/team-invites";
import { UserMenu } from "@/components/user-menu";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Teams | Midday",
};

export default async function Teams() {
  const queryClient = getQueryClient();
  const teams = await queryClient.fetchQuery(trpc.team.list.queryOptions());
  const invites = await queryClient.fetchQuery(
    trpc.team.invites.queryOptions(),
  );

  prefetch(trpc.user.me.queryOptions());

  // If no teams and no invites, redirect to create team
  if (!teams?.length && !invites?.length) {
    redirect("/teams/create");
  }

  return (
    <HydrateClient>
      <header className="w-full absolute left-0 right-0 flex justify-between items-center">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.LogoSmall />
          </Link>
        </div>

        <div className="mr-5 mt-4 md:mr-10 md:mt-10">
          <UserMenu onlySignOut />
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div>
            <div className="text-center">
              <h1 className="text-lg mb-2 font-serif">Welcome back</h1>
              <p className="text-[#878787] text-sm mb-8">
                Select team or create a new one.
              </p>
            </div>
          </div>

          {/* If there are teams, show them */}
          {teams?.length && (
            <>
              <span className="text-sm font-mono text-[#878787] mb-4">
                Teams
              </span>
              <div className="max-h-[260px] overflow-y-auto">
                <SelectTeamTable data={teams} />
              </div>
            </>
          )}

          {/* If there are invites, show them */}
          {invites?.length > 0 && <TeamInvites />}

          <div className="text-center mt-12 border-t-[1px] border-border pt-6 w-full relative border-dashed">
            <span className="absolute left-1/2 -translate-x-1/2 text-sm text-[#878787] bg-background -top-3 px-4">
              Or
            </span>
            <Link href="/teams/create" className="w-full">
              <Button className="w-full mt-2" variant="outline">
                Create team
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
