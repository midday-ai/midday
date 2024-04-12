import { AppDetails } from "@/components/app-details";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import type { Metadata } from "next";
import { features } from "./features";

export const metadata: Metadata = {
  title: "Feature Request",
};

export default async function Page() {
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

      <DialogContent className="sm:max-w-[500px]">
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Request</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex space-x-4 mt-8">
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogTrigger>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
