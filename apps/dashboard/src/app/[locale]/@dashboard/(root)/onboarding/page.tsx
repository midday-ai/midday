import { ConnectBank } from "@/components/connect-bank";
import { SignupApps } from "@/components/signup-apps";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | Midday",
};

export default function Onboarding() {
  return (
    <div className="relative py-12 px-6">
      <div className="steps-gradient absolute top-12 left-12 h-[800px] w-px" />

      <div className="pl-20">
        <div className="mb-14">
          <h1 className="text-[26px] mb-1">Get started</h1>
          <p className="text-sm text-[#B0B0B0]">
            Follow the steps to get started with Midday
          </p>
        </div>

        <div className="space-y-6">
          <ConnectBank />
          <SignupApps />
        </div>
      </div>
    </div>
  );
}
