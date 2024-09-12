import React, { useCallback } from "react";
import { Icon } from "@/components/editor/editorAtom/icon";
import * as PopoverMenu from "@/components/editor/editorAtom/popoverMenu";
import { Toolbar } from "@/components/editor/editorAtom/toolbar";
import { MenuProps, ShouldShowProps } from "@/components/editor/menus/types";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react";

import { isRowGripSelected } from "./utils";

export const TableRowMenu = React.memo(
  ({ editor, appendTo }: MenuProps): JSX.Element => {
    const shouldShow = useCallback(
      ({ view, state, from }: ShouldShowProps) => {
        if (!state || !from) {
          return false;
        }

        return isRowGripSelected({ editor, view, state, from });
      },
      [editor],
    );

    const onAddRowBefore = useCallback(() => {
      editor.chain().focus().addRowBefore().run();
    }, [editor]);

    const onAddRowAfter = useCallback(() => {
      editor.chain().focus().addRowAfter().run();
    }, [editor]);

    const onDeleteRow = useCallback(() => {
      editor.chain().focus().deleteRow().run();
    }, [editor]);

    return (
      <BaseBubbleMenu
        editor={editor}
        pluginKey="tableRowMenu"
        updateDelay={0}
        tippyOptions={{
          appendTo: () => {
            return appendTo?.current;
          },
          placement: "left",
          offset: [0, 15],
          popperOptions: {
            modifiers: [{ name: "flip", enabled: false }],
          },
        }}
        shouldShow={shouldShow}
      >
        <Toolbar.Wrapper isVertical>
          <PopoverMenu.Item
            iconComponent={<Icon name="ArrowUpToLine" />}
            close={false}
            label="Add row before"
            onClick={onAddRowBefore}
          />
          <PopoverMenu.Item
            iconComponent={<Icon name="ArrowDownToLine" />}
            close={false}
            label="Add row after"
            onClick={onAddRowAfter}
          />
          <PopoverMenu.Item
            icon="Trash"
            close={false}
            label="Delete row"
            onClick={onDeleteRow}
          />
        </Toolbar.Wrapper>
      </BaseBubbleMenu>
    );
  },
);

TableRowMenu.displayName = "TableRowMenu";

export default TableRowMenu;
