import React from "react";
import { Editor as CoreEditor } from "@tiptap/core";
import { EditorState } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { Editor } from "@tiptap/react";

export interface MenuProps {
  editor: Editor;
  appendTo?: React.RefObject<any>;
  shouldHide?: boolean;
}

export interface ShouldShowProps {
  editor?: CoreEditor;
  view: EditorView;
  state?: EditorState;
  oldState?: EditorState;
  from?: number;
  to?: number;
}
