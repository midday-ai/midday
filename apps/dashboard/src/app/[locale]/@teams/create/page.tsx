import { getTeams } from "@midday/supabase/cached-queries";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import Link from "next/link";

export default async function CreateTeam() {
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
            <h1 className="text-2xl font-medium mb-8">
              What’s the name of your company or team?
            </h1>
          </div>

          <div className="mb-2">
            <p className="text-sm">
              This will be the name of your Midday workspace — choose something
              that your team will recognize.
            </p>
          </div>

          <Input
            className="mt-3"
            placeholder="Ex: Acme Marketing or Acme Co"
            required
            autocomplete="off"
          />

          <Button className="mt-6">Next</Button>
        </div>
      </div>
    </div>
  );
}
