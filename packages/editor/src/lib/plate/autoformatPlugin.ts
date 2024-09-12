import { autoformatRules } from "@/lib/plate/autoformatRules";
import { AutoformatPlugin } from "@udecode/plate-autoformat";
import { PlatePlugin } from "@udecode/plate-common";

export const autoformatPlugin: Partial<PlatePlugin<AutoformatPlugin>> = {
  options: {
    rules: autoformatRules as any,
    enableUndoOnDelete: true,
  },
};
