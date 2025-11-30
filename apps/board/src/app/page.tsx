import { QueueOverview } from "@/components/queue-overview";

export default async function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <QueueOverview />
    </div>
  );
}
