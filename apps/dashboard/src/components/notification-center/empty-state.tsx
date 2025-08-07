import { Icons } from "@midday/ui/icons";

interface EmptyStateProps {
  description: string;
}

export function EmptyState({ description }: EmptyStateProps) {
  return (
    <div className="h-[460px] flex items-center justify-center flex-col space-y-4">
      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
        <Icons.Inbox className="w-[18px] h-[18px]" />
      </div>
      <p className="text-[#606060] text-sm">{description}</p>
    </div>
  );
}
