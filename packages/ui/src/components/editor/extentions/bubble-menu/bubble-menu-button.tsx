"use client";

interface BubbleMenuButtonProps {
  action: () => void;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BubbleMenuButton({
  action,
  isActive,
  children,
  className,
}: BubbleMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={action}
      className={`px-2.5 py-1.5 text-[11px] font-mono transition-colors ${className} ${
        isActive
          ? "bg-white dark:bg-stone-900 text-primary"
          : "bg-transparent hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
