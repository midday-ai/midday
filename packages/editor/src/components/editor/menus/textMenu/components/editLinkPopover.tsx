import { Icon } from "@/components/editor/editorAtom/icon";
import { Toolbar } from "@/components/editor/editorAtom/toolbar";
import { LinkEditorPanel } from "@/components/editor/panels";
import * as Popover from "@radix-ui/react-popover";

export type EditLinkPopoverProps = {
  onSetLink: (link: string, openInNewTab?: boolean) => void;
};

export const EditLinkPopover = ({ onSetLink }: EditLinkPopoverProps) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Toolbar.Button tooltip="Set Link">
          <Icon name="Link" />
        </Toolbar.Button>
      </Popover.Trigger>
      <Popover.Content>
        <LinkEditorPanel onSetLink={onSetLink} />
      </Popover.Content>
    </Popover.Root>
  );
};
