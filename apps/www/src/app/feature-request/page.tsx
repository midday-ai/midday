import type { Metadata } from "next";
import { AppDetails } from "@/components/app-details";
import { FeatureRequestModal } from "@/components/feature-request-modal";
import { Button } from "@midday/ui/button";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";

import { features } from "./features";

export const metadata: Metadata = {
  title: "Feature Request",
};

export default async function Page() {
  return (
    <Dialog>
      <div className="container max-w-[1050px]">
        <h1 className="mb-8 mt-24 text-center text-5xl font-medium">
          Feature Request
        </h1>

        <p className="font-sm m-auto max-w-[550px] text-center text-[#878787]">
          Follow our roadmap and vote for what will be our next priority.
        </p>

        <div className="mt-8 flex justify-center">
          <DialogTrigger asChild>
            <Button
              className="border-primary bg-transparent px-4 text-primary"
              variant="outline"
            >
              Submit a request
            </Button>
          </DialogTrigger>
        </div>

        <div className="divide-y">
          {features.map((feature) => {
            return <AppDetails key={feature.id} {...feature} />;
          })}
        </div>
      </div>

      <FeatureRequestModal />
    </Dialog>
  );
}
