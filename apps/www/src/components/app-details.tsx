import { Suspense } from "react";
import { Vote } from "@/components/vote";
import { Skeleton } from "@midday/ui/skeleton";

export function AppDetails({ id, name, description, logo, active }) {
  return (
    <section
      key={id}
      className="mt-10 flex flex-col pt-10 first:pt-0 md:flex-row md:items-center md:space-x-12"
    >
      <div className="flex h-[230px] w-full items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#171717] md:h-[200px] md:w-[300px]">
        {logo}
      </div>
      <div className="my-6 md:my-0 md:flex-1">
        <div className="mb-4 flex space-x-2 md:items-center">
          <h2 className="font-medium">{name}</h2>
          {active && (
            <button
              disabled
              type="button"
              className="relative overflow-hidden rounded-lg p-[1px]"
              style={{
                background:
                  "linear-gradient(-45deg, rgba(235,248,255,.18) 0%, #848f9c 50%, rgba(235,248,255,.18) 100%)",
              }}
            >
              <span className="flex h-full items-center gap-4 rounded-[7px] bg-background px-2 py-1 text-xs font-normal">
                Under development
              </span>
            </button>
          )}
        </div>
        <p className="text-sm text-[#606060]">{description}</p>
      </div>

      <Suspense fallback={<Skeleton className="h-16 w-14 flex-col p-6" />}>
        <Vote id={id} />
      </Suspense>
    </section>
  );
}
