import { QueueList } from "@/components/queue-list";
import { RecentJobs } from "@/components/recent-jobs";

export default async function QueuesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="pt-6">
        <h1 className="text-[18px] font-normal font-serif text-primary mb-2">
          Queues
        </h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <QueueList />
      </div>

      <div>
        <h2 className="text-[18px] font-normal font-serif text-primary mb-4">
          Recent Jobs
        </h2>
        <RecentJobs />
      </div>
    </div>
  );
}
