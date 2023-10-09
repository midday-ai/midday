import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Overview | Midday",
};

export default async function Overview() {
  const connected = false;

  if (!connected) {
    redirect("/onboarding");
  }

  return <p>Overview</p>;
}
