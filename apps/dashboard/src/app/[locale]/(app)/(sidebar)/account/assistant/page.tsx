import { getAssistantSettings } from "@/actions/ai/storage";
import { AssistantHistory } from "@/components/assistant-history";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assistant | Midday",
};

export default async function Page() {
  const settings = await getAssistantSettings();

  return (
    <div className="space-y-12">
      <AssistantHistory enabled={settings?.enabled} />
    </div>
  );
}
