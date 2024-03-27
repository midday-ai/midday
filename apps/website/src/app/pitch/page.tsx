import { PitchCarusel } from "@/components/pitch/pitch-carousel";
import { Grid } from "@/components/pitch/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pitch | Midday",
};

export default function Page() {
  return (
    <div className="fixed top-0 bottom-0 right-0 left-0 h-screen">
      <Grid />

      <PitchCarusel />
    </div>
  );
}
