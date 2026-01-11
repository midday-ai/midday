import { EmptyState } from "@/components/shared/empty-state";
import { useOverview } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Activity, AlertCircle, CheckCircle, Layers } from "lucide-react";

interface OverviewPageProps {
  onQueueSelect: (queue: string) => void;
}

export function OverviewPage({ onQueueSelect }: OverviewPageProps) {
  const { data, isLoading, error } = useOverview();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i.toString()}
              className="h-24 border bg-card animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load overview"
        description={error.message}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={data.totalJobs.toLocaleString()}
          description="In queue"
          icon={Layers}
        />
        <StatCard
          title="Active"
          value={data.activeJobs.toLocaleString()}
          description="Currently processing"
          icon={Activity}
          accent="warning"
        />
        <StatCard
          title="Failed"
          value={data.failedJobs.toLocaleString()}
          description="Need attention"
          icon={AlertCircle}
          accent={data.failedJobs > 0 ? "destructive" : undefined}
        />
        <StatCard
          title="Completed"
          value={data.completedToday.toLocaleString()}
          description="Today"
          icon={CheckCircle}
          accent="success"
        />
      </div>

      {/* Queues Grid */}
      <div>
        <h3 className="font-medium mb-4">Queues</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.queues.map((queue) => (
            <button
              type="button"
              key={queue.name}
              onClick={() => onQueueSelect(queue.name)}
              className="text-left p-4 border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono font-medium">{queue.name}</span>
                {queue.isPaused && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5">
                    Paused
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs">Waiting</div>
                  <div className="font-medium">{queue.counts.waiting}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Active</div>
                  <div className="font-medium text-warning">
                    {queue.counts.active}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Failed</div>
                  <div
                    className={cn(
                      "font-medium",
                      queue.counts.failed > 0 && "text-destructive",
                    )}
                  >
                    {queue.counts.failed}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  accent?: "success" | "warning" | "destructive";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: StatCardProps) {
  const accentClasses = {
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  return (
    <div className="p-4 border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div
        className={cn(
          "text-2xl font-semibold",
          accent && accentClasses[accent],
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </div>
  );
}
