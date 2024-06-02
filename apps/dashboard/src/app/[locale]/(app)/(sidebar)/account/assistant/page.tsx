import { getAssistantSettings } from "@/actions/ai/storage";
import { AssistantHistory } from "@/components/assistant-history";
// import { AssistantProvider } from "@/components/assistant-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistant | Midday",
};

export default async function Page() {
  const settings = await getAssistantSettings();

  return (
    <div className="space-y-12">
      {/* <AssistantProvider provider={settings?.provider} /> */}
      <AssistantHistory enabled={settings?.enabled} />
    </div>
  );
}
