interface MetricItem {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
}

interface MetricGridProps {
  items: MetricItem[];
  columns?: number;
}

export function MetricGrid({ items, columns = 2 }: MetricGridProps) {
  return (
    <div className="mb-6">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {items.map((item) => (
          <div key={item.id} className="border border-border p-3 bg-card">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {item.title}
              </div>
              <div className="text-lg font-normal font-sans text-foreground mb-1">
                {item.value}
              </div>
              {item.subtitle && (
                <div className="text-[10px] text-muted-foreground">
                  {item.subtitle}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
