import { Suspense } from "react";
import { AssistantWidget } from "./assistant-widget";

export async function Assistant() {
  return (
    <div className="border aspect-square overflow-hidden relative flex flex-col p-4 md:p-8">
      <h2 className="text-lg">Assistant</h2>

      <Suspense fallback={<p>Loading...</p>}>
        <AssistantWidget />
      </Suspense>
    </div>
  );
}
