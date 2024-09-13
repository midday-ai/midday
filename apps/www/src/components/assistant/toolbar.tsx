type Props = {
  onNewChat: () => void;
};

export function Toolbar({ onNewChat }: Props) {
  return (
    <button
      onClick={onNewChat}
      type="button"
      className="absolute bottom-4 left-4 right-4 z-50"
    >
      <div className="flex items-center justify-center">
        <div className="flex h-8 w-full items-center justify-between space-x-4 rounded-lg bg-[#F6F6F3]/95 px-2 text-[#878787] dark:bg-[#1A1A1A]/95">
          <div className="flex items-center space-x-3">
            <kbd className="pointer-events-none flex h-5 select-none items-center gap-1.5 rounded border bg-[#2C2C2C] bg-accent px-1.5 font-mono text-[11px] font-medium">
              <span className="text-[16px]">⌘</span>J
            </kbd>
            <span className="text-xs">New chat</span>
          </div>
        </div>
      </div>
    </button>
  );
}
