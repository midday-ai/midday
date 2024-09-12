import { useCallback } from "react";
import { Icon } from "@/components/editor/editorAtom/icon";
import { Toolbar } from "@/components/editor/editorAtom/toolbar";
import { MenuProps } from "@/components/editor/menus/types";
import { getRenderContainer } from "@/lib/editor/utils/getRenderContainer";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react";
import { sticky } from "tippy.js";
import { v4 as uuid } from "uuid";

import { ColumnLayout } from "../columns";

export const ColumnsMenu = ({ editor, appendTo }: MenuProps) => {
  const getReferenceClientRect = useCallback(() => {
    const renderContainer = getRenderContainer(editor, "columns");
    const rect =
      renderContainer?.getBoundingClientRect() ||
      new DOMRect(-1000, -1000, 0, 0);

    return rect;
  }, [editor]);

  const shouldShow = useCallback(() => {
    const isColumns = editor.isActive("columns");
    return isColumns;
  }, [editor]);

  const onColumnLeft = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarLeft).run();
  }, [editor]);

  const onColumnRight = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.SidebarRight).run();
  }, [editor]);

  const onColumnTwo = useCallback(() => {
    editor.chain().focus().setLayout(ColumnLayout.TwoColumn).run();
  }, [editor]);

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`columnsMenu-${uuid()}`}
      shouldShow={shouldShow}
      updateDelay={0}
      tippyOptions={{
        offset: [0, 8],
        popperOptions: {
          modifiers: [{ name: "flip", enabled: false }],
        },
        getReferenceClientRect,
        appendTo: () => appendTo?.current,
        plugins: [sticky],
        sticky: "popper",
      }}
    >
      <Toolbar.Wrapper>
        <Toolbar.Button
          tooltip="Sidebar left"
          active={editor.isActive("columns", {
            layout: ColumnLayout.SidebarLeft,
          })}
          onClick={onColumnLeft}
        >
          <Icon name="PanelLeft" />
        </Toolbar.Button>
        <Toolbar.Button
          tooltip="Two columns"
          active={editor.isActive("columns", {
            layout: ColumnLayout.TwoColumn,
          })}
          onClick={onColumnTwo}
        >
          <Icon name="Columns" />
        </Toolbar.Button>
        <Toolbar.Button
          tooltip="Sidebar right"
          active={editor.isActive("columns", {
            layout: ColumnLayout.SidebarRight,
          })}
          onClick={onColumnRight}
        >
          <Icon name="PanelRight" />
        </Toolbar.Button>
      </Toolbar.Wrapper>
    </BaseBubbleMenu>
  );
};

export default ColumnsMenu;
