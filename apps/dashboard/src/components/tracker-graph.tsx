import { TrackerMonthGraph } from "./tracker-month-graph";

export function TrackerGraph() {
  return (
    <div>
      <div className="mt-8">
        <h2 className="font-medium text-[#878787] text-xl mb-2">Total hours</h2>
        <div className="text-[#F5F5F3] text-4xl">294</div>
      </div>

      <div className="flex row space-x-[45px] mt-8">
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
        <TrackerMonthGraph date={new Date().toString()} />
      </div>
    </div>
  );
}
