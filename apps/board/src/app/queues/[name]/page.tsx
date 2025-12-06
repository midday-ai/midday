import { QueueDetail } from "@/components/queue-detail";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  return <QueueDetail queueName={name} />;
}
