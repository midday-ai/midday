import { SelectTeamTable } from "@/components/tables/select-team/table";
import { getTeams } from "@midday/supabase/cached-queries";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Teams() {
  const { data } = await getTeams();

  if (!data.length > 0) {
    redirect("/teams/create");
  }

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
        <div className="relative z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div>
            <h1 className="text-2xl font-medium mb-8">Welcome back</h1>
          </div>

          <div className="mb-2">Teams</div>

          <SelectTeamTable data={data} />
          {/* TODO Pending invites */}

          <div className="text-center mt-6">
            <Link href="/teams/create" className="text-sm">
              Create team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
