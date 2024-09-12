import { useCallback } from "react";
import { DropdownButton } from "@/components/editor/editorAtom/dropdown";
import { Icon } from "@/components/editor/editorAtom/icon";
import { Surface } from "@/components/editor/editorAtom/surface";
import { Toolbar } from "@/components/editor/editorAtom/toolbar";
import { languages, tones } from "@/lib/editor/constants";
import * as Dropdown from "@radix-ui/react-dropdown-menu";

export type AIDropdownProps = {
  onSimplify: () => void;
  onFixSpelling: () => void;
  onMakeShorter: () => void;
  onMakeLonger: () => void;
  onEmojify: () => void;
  onTldr: () => void;
  onTranslate: (language: string) => void;
  onTone: (tone: string) => void;
  onCompleteSentence: () => void;
};

export const AIDropdown = ({
  onCompleteSentence,
  onEmojify,
  onFixSpelling,
  onMakeLonger,
  onMakeShorter,
  onSimplify,
  onTldr,
  onTone,
  onTranslate,
}: AIDropdownProps) => {
  const handleTone = useCallback(
    (tone: string) => () => onTone(tone),
    [onTone],
  );
  const handleTranslate = useCallback(
    (language: string) => () => onTranslate(language),
    [onTranslate],
  );

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <Toolbar.Button
          className="text-purple-500 hover:text-purple-600 active:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 dark:active:text-purple-400"
          activeClassname="text-purple-600 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-200"
        >
          <Icon name="Sparkles" className="mr-1" />
          AI Tools
          <Icon name="ChevronDown" className="ml-1 h-2 w-2" />
        </Toolbar.Button>
      </Dropdown.Trigger>
      <Dropdown.Content asChild>
        <Surface className="min-w-[10rem] p-2">
          <Dropdown.Item onClick={onSimplify}>
            <DropdownButton>
              <Icon name="CircleSlash" />
              Simplify
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Item onClick={onFixSpelling}>
            <DropdownButton>
              <Icon name="Eraser" />
              Fix spelling & grammar
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Item onClick={onMakeShorter}>
            <DropdownButton>
              <Icon name="ArrowLeftToLine" />
              Make shorter
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Item onClick={onMakeLonger}>
            <DropdownButton>
              <Icon name="ArrowRightToLine" />
              Make longer
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>
              <DropdownButton>
                <Icon name="Mic" />
                Change tone
                <Icon name="ChevronRight" className="ml-auto h-4 w-4" />
              </DropdownButton>
            </Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <Surface className="flex max-h-[20rem] min-w-[15rem] flex-col overflow-auto p-2">
                {tones.map((tone) => (
                  <Dropdown.Item
                    onClick={handleTone(tone.value)}
                    key={tone.value}
                  >
                    <DropdownButton>{tone.label}</DropdownButton>
                  </Dropdown.Item>
                ))}
              </Surface>
            </Dropdown.SubContent>
          </Dropdown.Sub>
          <Dropdown.Item onClick={onTldr}>
            <DropdownButton>
              <Icon name="MoreHorizontal" />
              Tl;dr:
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Item onClick={onEmojify}>
            <DropdownButton>
              <Icon name="SmilePlus" />
              Emojify
            </DropdownButton>
          </Dropdown.Item>
          <Dropdown.Sub>
            <Dropdown.SubTrigger>
              <DropdownButton>
                <Icon name="Languages" />
                Translate
                <Icon name="ChevronRight" className="ml-auto h-4 w-4" />
              </DropdownButton>
            </Dropdown.SubTrigger>
            <Dropdown.SubContent>
              <Surface className="flex max-h-[20rem] min-w-[15rem] flex-col overflow-auto p-2">
                {languages.map((lang) => (
                  <Dropdown.Item
                    onClick={handleTranslate(lang.value)}
                    key={lang.value}
                  >
                    <DropdownButton>{lang.label}</DropdownButton>
                  </Dropdown.Item>
                ))}
              </Surface>
            </Dropdown.SubContent>
          </Dropdown.Sub>
          <Dropdown.Item onClick={onCompleteSentence}>
            <DropdownButton>
              <Icon name="PenLine" />
              Complete sentence
            </DropdownButton>
          </Dropdown.Item>
        </Surface>
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
