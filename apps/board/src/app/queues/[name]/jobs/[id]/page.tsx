import { JobDetail } from "@/components/job-detail";
import Link from "next/link";

export default async function JobPage({
  params,
}: {
  params: Promise<{ name: string; id: string }>;
}) {
  const { name, id } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="pt-6">
        <Link
          href={`/queues/${name}`}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to {name}
        </Link>
      </div>

      <JobDetail queueName={name} jobId={id} />
    </div>
  );
}
