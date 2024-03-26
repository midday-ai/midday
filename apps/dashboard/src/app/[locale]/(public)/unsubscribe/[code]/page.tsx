import { verifyUnsubscribeLink } from "@midday/email";
import { client } from "@midday/jobs";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Unsubscribe({
  params,
}: {
  params: { code: string };
}) {
  const decodedToken = await verifyUnsubscribeLink(params.code);

  if (!decodedToken?.id) {
    return notFound();
  }

  try {
    await client.cancelRunsForEvent(decodedToken.id as string);
  } catch {
    return notFound();
  }

  return (
    <div>
      <header className="w-full absolute left-0 right-0">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="https://midday.ai">
            <Icons.Logo />
          </Link>
        </div>
      </header>

      <div className="flex min-h-screen justify-center items-center overflow-hidden p-6 md:p-0">
        <div className="relative z-20 m-auto flex w-full max-w-[380px] flex-col">
          <div className="flex w-full flex-col relative">
            <div className="pb-4 bg-gradient-to-r from-primary dark:via-primary dark:to-[#848484] to-[#000] inline-block text-transparent bg-clip-text">
              <h1 className="font-medium pb-1 text-3xl">Unsubscribed.</h1>
            </div>

            <p className="font-medium pb-1 text-2xl text-[#878787]">
              You are now successfully unsubscribed
              <br />
              from our onboarding emails.
            </p>

            <div className="pointer-events-auto mt-6 flex flex-col mb-4 space-y-4">
              <Link href="https://app.midday.ai" className="w-full">
                <Button className="w-full h-10">Go to dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
