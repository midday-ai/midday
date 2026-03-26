import { Skeleton } from "@midday/ui/skeleton";

export function InvoiceSkeleton() {
  const width = 595;
  const height = 842;

  return (
    <div
      className="w-full mx-auto bg-[#fcfcfc] dark:bg-[#0f0f0f] border border-border overflow-hidden"
      style={{ maxWidth: width }}
    >
      <div className="p-8 flex flex-col" style={{ minHeight: height - 5 }}>
        {/* Header: meta left, logo right */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 mr-5">
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-3 w-36 mb-1.5" />
            <Skeleton className="h-3 w-32 mb-1.5" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-[60px] w-[120px] shrink-0" />
        </div>

        {/* From / To */}
        <div className="grid grid-cols-2 gap-6 mt-6 mb-4">
          <div>
            <Skeleton className="h-3 w-10 mb-2" />
            <Skeleton className="h-3 w-40 mb-1" />
            <Skeleton className="h-3 w-36 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div>
            <Skeleton className="h-3 w-10 mb-2" />
            <Skeleton className="h-3 w-40 mb-1" />
            <Skeleton className="h-3 w-36 mb-1" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        {/* Line items header */}
        <div className="mt-5">
          <div className="flex gap-4 items-end mb-2 pb-2 border-b border-border">
            <Skeleton className="h-3 flex-[1.5]" />
            <Skeleton className="h-3 w-[15%]" />
            <Skeleton className="h-3 w-[15%]" />
            <Skeleton className="h-3 w-[15%]" />
          </div>
          {[0.85, 0.7, 0.6].map((opacity) => (
            <div
              key={opacity}
              className="flex gap-4 items-start py-1.5"
              style={{ opacity }}
            >
              <Skeleton className="h-3 flex-[1.5]" />
              <Skeleton className="h-3 w-[15%]" />
              <Skeleton className="h-3 w-[15%]" />
              <Skeleton className="h-3 w-[15%]" />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-10 flex justify-end mb-8">
          <div className="w-[320px] flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex justify-between pt-3 mt-2 border-t border-border">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>

        {/* Footer: payment + note */}
        <div className="mt-auto">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-3 w-44 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div>
              <Skeleton className="h-3 w-12 mb-2" />
              <Skeleton className="h-3 w-40 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
