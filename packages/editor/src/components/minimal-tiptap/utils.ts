import type { Editor } from "@tiptap/core";

import type { MinimalTiptapProps } from "./components/minimal-tiptap";

export const activeItemClass =
  "bg-primary/10 hover:bg-primary/10 focus:bg-primary/10";
export const DropdownMenuItemClass =
  "flex flex-row items-center justify-between gap-4";

let isMac: boolean | undefined;

interface Navigator {
  userAgentData?: {
    brands: { brand: string; version: string }[];
    mobile: boolean;
    platform: string;
    getHighEntropyValues: (hints: string[]) => Promise<{
      platform: string;
      platformVersion: string;
      uaFullVersion: string;
    }>;
  };
}

function getPlatform(): string {
  const nav = navigator as Navigator;

  if (nav.userAgentData) {
    if (nav.userAgentData.platform) {
      return nav.userAgentData.platform;
    }

    nav.userAgentData
      .getHighEntropyValues(["platform"])
      .then((highEntropyValues) => {
        if (highEntropyValues.platform) {
          return highEntropyValues.platform;
        }
      });
  }

  if (typeof navigator.platform === "string") {
    return navigator.platform;
  }

  return "";
}

export function isMacOS() {
  if (isMac === undefined) {
    isMac = getPlatform().toLowerCase().includes("mac");
  }

  return isMac;
}

export function getShortcutKey(key: string) {
  if (key.toLowerCase() === "mod") {
    return isMacOS() ? "⌘" : "Ctrl";
  } else if (key.toLowerCase() === "alt") {
    return isMacOS() ? "⌥" : "Alt";
  } else if (key.toLowerCase() === "shift") {
    return isMacOS() ? "⇧" : "Shift";
  } else {
    return key;
  }
}

export function getShortcutKeys(keys: string[]) {
  return keys.map((key) => getShortcutKey(key)).join("");
}

export function getOutput(
  editor: Editor,
  format: MinimalTiptapProps["outputValue"],
) {
  if (format === "json") {
    return JSON.stringify(editor.getJSON());
  }

  if (format === "html") {
    return editor.getText() ? editor.getHTML() : "";
  }

  return editor.getText();
}
