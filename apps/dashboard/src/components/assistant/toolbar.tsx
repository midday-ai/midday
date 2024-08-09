type Props = {
  onNewChat: () => void;
};

export function Toolbar({ onNewChat }: Props) {
  return (
    <button onClick={onNewChat} type="button">
      <div className="left-4 right-4 absolute z-20 bottom-4 flex items-center justify-center">
        <div className="dark:bg-[#1A1A1A]/95 bg-[#F6F6F3]/95 h-8 w-full justify-between items-center flex px-2 space-x-4 text-[#878787]">
          <div className="flex items-center space-x-3">
            <kbd className="pointer-events-none h-5 select-none items-center gap-1.5 rounded border bg-accent px-1.5 font-mono text-[11px] font-medium flex bg-[#2C2C2C]">
              <span className="text-[16px]">⌘</span>J
            </kbd>
            <span className="text-xs">New chat</span>
          </div>
        </div>
      </div>
    </button>
  );
}
