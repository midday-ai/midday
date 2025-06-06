"use client";

import { chatExamples } from "@/components/chat/examples";
import { useAssistantStore } from "@/store/assistant";
import { invoke } from "@midday/desktop-client/core";

export function AssistantList() {
  const { setOpen } = useAssistantStore();

  const toggle = async () => {
    await invoke("set_auth_status", { authStatus: true });
  };

  return (
    <button onClick={toggle} type="button">
      Toggle
    </button>
  );

  return (
    <div className="mb-16">
      <ul className="flex flex-col justify-center items-center space-y-3 flex-shrink">
        {chatExamples.slice(0, 5).map((example) => (
          <li
            key={example}
            className="rounded-full dark:bg-secondary bg-[#F2F1EF] text-xs font-mono text-[#606060] hover:opacity-80 transition-all cursor-default"
          >
            <button
              onClick={() => setOpen(example)}
              type="button"
              className="inline-block p-3 py-2"
            >
              <span>{example}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
