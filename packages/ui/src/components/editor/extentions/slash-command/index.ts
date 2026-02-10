import { Extension } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import Suggestion from "@tiptap/suggestion";
import type { SlashCommandItem } from "./types";

export type SlashCommandOptions = {
  suggestion: Omit<SuggestionOptions<SlashCommandItem>, "editor">;
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export type { SlashMenuRef } from "./slash-menu";
export { SlashMenu } from "./slash-menu";
export type { SlashCommandItem, SlashCommandSubItem } from "./types";
