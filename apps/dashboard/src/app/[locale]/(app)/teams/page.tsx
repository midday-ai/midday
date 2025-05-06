import { SelectTeamTable } from "@/components/tables/select-team/table";
import { UserMenu } from "@/components/user-menu";
import { HydrateClient, getQueryClient, prefetch, trpc } from "@/trpc/server";
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

  prefetch(trpc.user.me.queryOptions());

  if (!teams?.length) {
    redirect("/teams/create");
  }

  return (
    <HydrateClient>
      <header className="w-full absolute left-0 right-0 flex justify-between items-center">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/">
            <Icons.Logo />
          </Link>
        </div>

        <div className="mr-5 mt-4 md:mr-10 md:mt-10">
          <UserMenu onlySignOut />
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div>
            <h1 className="text-2xl font-medium pb-4">Welcome back</h1>
            <p className="text-sm text-[#878787] mb-8">
              Select team or create a new one.
            </p>
          </div>

          <SelectTeamTable data={teams} />

          <div className="text-center mt-8 border-t-[1px] border-border pt-6">
            <Link href="/teams/create" className="text-sm">
              Create team
            </Link>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
