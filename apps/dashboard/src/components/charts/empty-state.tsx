import { AddAccountButton } from "@/components/add-account-button";

export function EmptyState() {
  return (
    <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center z-20">
      <div className="text-center max-w-md mx-auto flex flex-col items-center justify-center">
        <h2 className="text-xl font-medium mb-2">Connect bank account</h2>
        <p className="text-sm text-[#878787] mb-6">
          Connect your bank account to unlock powerful financial insights. Track
          your spending, analyze trends, and make informed decisions.
        </p>

        <AddAccountButton />
      </div>
    </div>
  );
}
