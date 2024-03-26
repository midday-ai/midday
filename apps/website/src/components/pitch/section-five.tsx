import Image from "next/image";
import overview from "./overview.png";
import { Card } from "./ui";

export function SectionFive() {
  return (
    <div className="h-screen relative">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Traction</span>
        <span className="text-[#878787]">Midday</span>
      </div>
      <div className="flex flex-col h-screen min-h-full justify-center">
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-8">
            <Card>
              <h2 className="text-2xl">Waitlist sign ups</h2>

              <p className="text-[#878787] text-sm text-center">
                We have built Midday in public on X and amassed nearly 4000
                signups ready to start using Midday.
              </p>

              <span className="mt-auto font-mono text-[122px]">1300</span>
            </Card>

            <Card>
              <h2 className="text-2xl">Github stars</h2>

              <p className="text-[#878787] text-sm text-center">
                Since going open source on the 20th of March 2024 we’ve gained
                834 stars on Github. Full documentation and how to contribute
                will follow soon.
              </p>

              <span className="mt-auto font-mono text-[122px]">840</span>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <h2 className="text-2xl">Private beta users</h2>

              <p className="text-[#878787] text-sm text-center">
                This is how many we’ve let into the system to start using it,
                joined the community and started to form Midday together with
                us.
              </p>

              <span className="mt-auto font-mono text-[122px]">3500</span>
            </Card>

            <Card>
              <h2 className="text-2xl">X Followers</h2>

              <p className="text-[#878787] text-sm text-center">
                Since building everything in public we’ve gained lots of
                engagement on our posts. We see this as great way to talk to our
                users.
              </p>

              <span className="mt-auto font-mono text-[122px]">839</span>
            </Card>
          </div>

          <div className="ml-auto w-full max-w-[820px] h-full border border-border rounded-xl">
            <h2>What users are saying</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
