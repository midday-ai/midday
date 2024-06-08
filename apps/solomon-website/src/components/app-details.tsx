import { Vote } from "@/components/vote";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";

export function AppDetails({ id, name, description, logo, active }) {
  return (
    <section
      key={id}
      className="flex md:space-x-12 md:flex-row md:items-center mt-10 pt-10 first:pt-0 flex-col"
    >
      <div className="md:w-[300px] w-full md:h-[200px] h-[230px] flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#171717]">
        {logo}
      </div>
      <div className="md:flex-1 my-6 md:my-0">
        <div className="flex md:items-center mb-4 space-x-2">
          <h2 className="font-medium">{name}</h2>
          {active && (
            <button
              disabled
              type="button"
              className="relative rounded-lg overflow-hidden p-[1px]"
              style={{
                background:
                  "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
              }}
            >
              <span className="flex items-center gap-4 py-1 px-2 rounded-[7px] bg-background text-xs h-full font-normal">
                Under development
              </span>
            </button>
          )}
        </div>
        <p className="text-sm text-[#606060]">{description}</p>
      </div>

      <Suspense fallback={<Skeleton className="p-6 flex-col w-14 h-16 " />}>
        <Vote id={id} />
      </Suspense>
    </section>
  );
}
