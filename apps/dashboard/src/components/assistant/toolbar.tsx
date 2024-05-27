type Props = {
  onNewChat: () => void;
};

export function Toolbar({ onNewChat }: Props) {
  return (
    <div className="left-4 right-4 absolute bottom-2 flex items-center justify-center">
      <div className="backdrop-filter backdrop-blur-lg dark:bg-[#1A1A1A]/80 bg-[#F6F6F3]/80 h-8 w-full justify-between items-center flex px-2 rounded-lg space-x-4 text-[#878787]">
        <button
          type="button"
          className="flex items-center space-x-3"
          onClick={onNewChat}
        >
          <kbd className="pointer-events-none h-5 select-none items-center gap-1.5 rounded border bg-accent px-1.5 font-mono text-xs font-medium flex bg-[#2C2C2C]">
            <span className="text-[16px]">⌘</span>N
          </kbd>
          <span className="text-xs">New chat</span>
        </button>
      </div>
    </div>
  );
}
