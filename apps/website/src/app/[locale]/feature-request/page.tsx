import { AppDetails } from "@/components/app-details";
import { FeatureRequestModal } from "@/components/feature-request-modal";
import { getStaticParams } from "@/locales/server";
import { Button } from "@midday/ui/button";
import { Dialog, DialogTrigger } from "@midday/ui/dialog";
import type { Metadata } from "next";
import { setStaticParamsLocale } from "next-international/server";
import { features } from "./features";

export const metadata: Metadata = {
  title: "Feature Request",
  description:
    "Follow our roadmap and vote for what will be our next priority.",
};

export function generateStaticParams() {
  return getStaticParams();
}

export default function Page({
  params: { locale },
}: { params: { locale: string } }) {
  setStaticParamsLocale(locale);

  return (
    <Dialog>
      <div className="container max-w-[1050px]">
        <h1 className="mt-24 font-medium text-center text-5xl mb-8">
          Feature Request
        </h1>

        <p className="text-[#878787] font-sm text-center max-w-[550px] m-auto">
          Follow our roadmap and vote for what will be our next priority.
        </p>

        <div className="flex justify-center mt-8">
          <DialogTrigger asChild>
            <Button
              className="bg-transparent text-primary px-4 border-primary"
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
