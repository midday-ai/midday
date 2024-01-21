import { BackButton } from "@/components/command-menu/back-button";

export function CommandAI() {
  return (
    <div className="h-full">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Midday AI</h2>
      </div>

      <div className="mt-28 flex items-center justify-center text-sm">
        <p>Under development</p>
      </div>
    </div>
  );
}
