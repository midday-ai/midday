import { getAssistantSettings } from "@/actions/ai/storage";
import { AssistantHistory } from "@/components/assistant-history";
import config from "@/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Assistant | ${config.company}`,
};

export default async function Page() {
  const settings = await getAssistantSettings();

  return (
    <div className="space-y-12">
      <AssistantHistory enabled={settings?.enabled} />
    </div>
  );
}
