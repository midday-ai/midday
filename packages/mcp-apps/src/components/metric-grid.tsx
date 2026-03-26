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
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 12,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid var(--border-color)",
              padding: 12,
              background: "var(--bg-card)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 400,
                  fontFamily: "var(--font-sans)",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {item.value}
              </div>
              {item.subtitle && (
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
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
