interface SectionProps {
  title?: string;
  content: string;
}

export function Section({ title, content }: SectionProps) {
  return (
    <div style={{ marginTop: 32, marginBottom: 16 }}>
      {title && (
        <h3
          style={{
            fontSize: 12,
            lineHeight: "normal",
            marginBottom: 12,
            color: "var(--text-muted)",
            fontWeight: 400,
          }}
        >
          {title}
        </h3>
      )}
      <div
        style={{
          fontSize: 12,
          lineHeight: "17px",
          fontFamily: "var(--font-sans)",
          color: "var(--text-primary)",
        }}
      >
        {content}
      </div>
    </div>
  );
}
