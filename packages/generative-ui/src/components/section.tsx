"use client";

interface SectionProps {
  title?: string;
  content: string;
}

export function Section({ title, content }: SectionProps) {
  return (
    <div className="mt-8 mb-4">
      {title && (
        <h3 className="text-[12px] leading-normal mb-3 text-[#707070] dark:text-[#666666]">
          {title}
        </h3>
      )}
      <div className="text-[12px] leading-[17px] font-sans text-black dark:text-white">
        {content}
      </div>
    </div>
  );
}
