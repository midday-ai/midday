import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  onBack,
  onRefresh,
  actions,
}: HeaderProps) {
  return (
    <>
      <div className="flex items-center gap-3 flex-1">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-mono">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        )}
      </div>
    </>
  );
}
