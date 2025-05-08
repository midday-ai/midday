import { Icons } from "@midday/ui/icons";

type Props = {
  onSubmit: () => void;
};

export function Footer({ onSubmit }: Props) {
  return (
    <div className="flex px-3 h-[40px] w-full border-t-[1px] items-center bg-background backdrop-filter dark:border-[#2C2C2C] backdrop-blur-lg dark:bg-[#151515]/[99]">
      <Icons.LogoSmall />

      <div className="ml-auto flex space-x-4">
        <button
          className="flex space-x-2 items-center text-xs"
          type="button"
          onClick={onSubmit}
        >
          <span>Submit</span>
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-accent px-1.5 font-mono text-[10px] font-medium">
            <span>↵</span>
          </kbd>
        </button>
      </div>
    </div>
  );
}
