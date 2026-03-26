interface SectionProps {
  title?: string;
  content: string;
}

export function Section({ title, content }: SectionProps) {
  return (
    <div className="mt-8 mb-4">
      {title && (
        <h3 className="text-xs leading-normal mb-3 text-muted-foreground font-normal">
          {title}
        </h3>
      )}
      <div className="text-xs leading-[17px] font-sans text-foreground">
        {content}
      </div>
    </div>
  );
}
