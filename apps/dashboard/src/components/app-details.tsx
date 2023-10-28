import { Vote } from "@/components/vote";
import { Skeleton } from "@midday/ui/skeleton";
import { Suspense } from "react";

export function AppDetails({ id, name, description, logo }) {
  return (
    <section key={id} className="flex space-x-12 items-center mt-10 pt-10">
      <div className="w-[300px] h-[200px] flex items-center justify-center bg-gradient-to-b from-[#1A1A1A] to-[#171717] rounded-xl">
        {logo}
      </div>
      <div className="flex-1">
        <h2 className="mb-4 font-medium">{name}</h2>
        <p className="text-sm text-[#606060]">{description}</p>
      </div>

      <Suspense fallback={<Skeleton className="p-6 flex-col w-14 h-16" />}>
        <Vote id={id} />
      </Suspense>
    </section>
  );
}
