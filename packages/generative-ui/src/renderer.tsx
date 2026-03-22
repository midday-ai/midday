"use client";

import type { Spec } from "@json-render/react";
import {
  ActionProvider,
  Renderer as JsonRenderRenderer,
  StateProvider,
  useJsonRenderMessage,
  VisibilityProvider,
} from "@json-render/react";
import type { UIMessage } from "ai";
import { registry } from "./registry";

export { useJsonRenderMessage } from "@json-render/react";

interface SpecRendererProps {
  spec: Spec;
}

export function SpecRenderer({ spec }: SpecRendererProps) {
  return (
    <StateProvider>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <JsonRenderRenderer spec={spec} registry={registry} />
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

interface MessageSpecRendererProps {
  parts: UIMessage["parts"];
}

export function MessageSpecRenderer({ parts }: MessageSpecRendererProps) {
  const { spec, hasSpec } = useJsonRenderMessage(parts as any);

  if (!hasSpec || !spec) return null;

  return <SpecRenderer spec={spec} />;
}
