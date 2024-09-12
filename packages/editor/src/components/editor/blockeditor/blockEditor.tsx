"use client";

import { RefObject, useMemo, useRef } from "react";
import { LinkMenu } from "@/components/editor/menus";
import {
  useBlockEditor,
  UseBlockEditorProps,
} from "@/hooks/editor/useBlockEditor";
import { EditorContent, PureEditorContent } from "@tiptap/react";

import "@/styles/index.css";

import { Loader } from "@/components/editor/editorAtom/loader";
import { Sidebar } from "@/components/editor/sidebar";
import { EditorContext } from "@/context/editor/editorContext";
import ImageBlockMenu from "@/extensions/imageBlock/components/imageBlockMenu";
import { ColumnsMenu } from "@/extensions/multiColumn/menus";
import { TableColumnMenu, TableRowMenu } from "@/extensions/table/menus";
import { useAIState } from "@/hooks/editor/useAIState";
import { PlusIcon } from "lucide-react";
import { createPortal } from "react-dom";

import { ContentItemMenu } from "../menus/contentItemMenu";
import { TextMenu } from "../menus/textMenu";
import { EditorHeader } from "./components/editorHeader";
import { TiptapProps } from "./types";

export const BlockEditor = ({
  aiToken,
  ydoc,
  provider,
  aiAppId,
  aiBaseUrl,
  content,
  onContentChange,
  label,
}: TiptapProps) => {
  const aiState = useAIState();
  const menuContainerRef = useRef(null);
  const editorRef = useRef<PureEditorContent | null>(null);

  const editorProps: UseBlockEditorProps = {
    aiToken,
    ydoc,
    provider,
    aiAppId,
    aiBaseUrl,
    content,
    onContentChange,
  };

  const { editor, users, characterCount, collabState, leftSidebar } =
    useBlockEditor(editorProps);

  const displayedUsers = users.slice(0, 3);

  const providerValue = useMemo(() => {
    return {
      isAiLoading: aiState.isAiLoading,
      aiError: aiState.aiError,
      setIsAiLoading: aiState.setIsAiLoading,
      setAiError: aiState.setAiError,
    };
  }, [aiState]);

  if (!editor) {
    return null;
  }

  const aiLoaderPortal = createPortal(
    <Loader label="AI is now doing its job." />,
    document.body,
  );

  return (
    <EditorContext.Provider value={providerValue}>
      <div className="flex h-full" ref={menuContainerRef}>
        <Sidebar
          isOpen={leftSidebar.isOpen}
          onClose={leftSidebar.close}
          editor={editor}
        />
        <div className="relative flex h-full flex-1 flex-col overflow-hidden">
          {label && onContentChange && (
            <div className="py-5">
              <button
                onClick={() => onContentChange(editor.getHTML())}
                className="flex w-fit flex-1 gap-2 rounded-2xl border bg-zinc-950 p-3 text-sm text-white dark:bg-white dark:text-zinc-950"
              >
                <PlusIcon className="h-5 w-5" />
                {label}
              </button>
            </div>
          )}
          <EditorHeader
            characters={characterCount.characters()}
            collabState={collabState}
            users={displayedUsers}
            words={characterCount.words()}
            isSidebarOpen={leftSidebar.isOpen}
            toggleSidebar={leftSidebar.toggle}
          />
          <EditorContent
            editor={editor}
            ref={editorRef as unknown as RefObject<HTMLDivElement>}
            className="flex-1 overflow-y-auto"
          />
          <ContentItemMenu editor={editor} />
          <LinkMenu editor={editor} appendTo={menuContainerRef} />
          <TextMenu editor={editor} />
          <ColumnsMenu editor={editor} appendTo={menuContainerRef} />
          <TableRowMenu editor={editor} appendTo={menuContainerRef} />
          <TableColumnMenu editor={editor} appendTo={menuContainerRef} />
          <ImageBlockMenu editor={editor} appendTo={menuContainerRef} />
        </div>
      </div>
      {aiState.isAiLoading && aiLoaderPortal}
    </EditorContext.Provider>
  );
};

export default BlockEditor;
