import { EditorUser } from "@/components/editor/blockeditor/types";
import { EditorContext } from "@/context/editor/editorContext";
import { ExtensionKit } from "@/extensions/extension-kit";
import { userColors, userNames } from "@/lib/editor/constants";
import { randomElement } from "@/lib/editor/utils";
import { TiptapCollabProvider, WebSocketStatus } from "@hocuspocus/provider";
import Ai from "@tiptap-pro/extension-ai";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { Editor, Extensions, useEditor } from "@tiptap/react";
import { useContext, useEffect, useMemo, useState } from "react";
import type { Doc as YDoc } from "yjs";

import { useSidebar } from "./useSidebar";

declare global {
  interface Window {
    editor: Editor | null;
  }
}

/*
 * UseBlockEditorProps - Props for useBlockEditor
 *  - aiToken: string
 *  - ydoc: YDoc
 *  - provider?: TiptapCollabProvider | null | undefined
 *  - aiAppId?: string
 *  - aiBaseUrl?: string
 *  - content?: string
 *  - onContentChange?: (content: string) => void
 *
 * @interface UseBlockEditorProps
 * */
export interface UseBlockEditorProps {
  aiToken: string;
  ydoc: YDoc;
  provider?: TiptapCollabProvider | null | undefined;
  aiAppId: string;
  aiBaseUrl: string;
  content?: string | undefined;
  onContentChange?: ((content: string) => void) | undefined;
}

export const useBlockEditor = ({
  aiToken,
  ydoc,
  provider,
  aiAppId,
  aiBaseUrl = "https://api.tiptap.dev/v1/ai",
  content,
}: UseBlockEditorProps) => {
  const leftSidebar = useSidebar();
  const [collabState, setCollabState] = useState<WebSocketStatus>(
    WebSocketStatus.Connected,
  );
  const { setIsAiLoading, setAiError } = useContext(EditorContext);

  const extensions = useMemo(() => {
    const basicExtensions = [
      ...ExtensionKit({
        provider,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      Ai.configure({
        appId: aiAppId,
        token: aiToken,
        baseUrl: aiBaseUrl,
        autocompletion: true,
        onLoading: () => {
          setIsAiLoading(true);
          setAiError(null);
        },
        onSuccess: () => {
          setIsAiLoading(false);
          setAiError(null);
        },
        onError: (error) => {
          setIsAiLoading(false);
          setAiError(error.message);
        },
      }),
    ] as Extensions;

    if (provider) {
      basicExtensions.push(
        CollaborationCursor.configure({
          provider,
          user: {
            name: randomElement(userNames),
            color: randomElement(userColors),
          },
        }),
      );
    }

    return basicExtensions;
  }, [ydoc, provider, aiToken]);

  const editor = useEditor(
    {
      autofocus: true,
      onCreate: ({ editor }) => {
        if (provider) {
          provider.on("synced", () => {
            if (editor.isEmpty && content) {
              editor.commands.setContent(content);
            }
          });
        }
      },
      extensions,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          class: "h-screen w-full",
        },
      },
      content: content || "",
    },
    [extensions],
  );

  const users = useMemo(() => {
    if (!editor?.storage.collaborationCursor?.users) {
      return [];
    }

    return editor.storage.collaborationCursor?.users.map((user: EditorUser) => {
      const names = user.name?.split(" ");
      const firstName = names?.[0];
      const lastName = names?.[names.length - 1];
      const initials = `${firstName?.[0] || "?"}${lastName?.[0] || "?"}`;

      return { ...user, initials: initials.length ? initials : "?" };
    });
  }, [editor?.storage.collaborationCursor?.users]);

  const characterCount = editor?.storage.characterCount || {
    characters: () => 0,
    words: () => 0,
  };

  useEffect(() => {
    provider?.on("status", (event: { status: WebSocketStatus }) => {
      setCollabState(event.status);
    });
  }, [provider]);

  window.editor = editor;

  return { editor, users, characterCount, collabState, leftSidebar };
};
