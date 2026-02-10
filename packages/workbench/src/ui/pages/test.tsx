import { AlertCircle, CheckCircle, FlaskConical } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTestJob } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { TestSearch } from "@/router";

interface TestPageProps {
  queues: string[];
  readonly?: boolean;
  prefill?: TestSearch;
}

export function TestPage({ queues, readonly, prefill }: TestPageProps) {
  const testJobMutation = useTestJob();
  const [queueName, setQueueName] = React.useState<string>(
    prefill?.queue || queues[0] || "",
  );
  const [jobName, setJobName] = React.useState(prefill?.jobName || "test-job");
  const [payload, setPayload] = React.useState(
    prefill?.payload || '{\n  "message": "Hello from Workbench"\n}',
  );
  const [delay, setDelay] = React.useState("");
  const [result, setResult] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Update state when prefill changes (e.g., navigating from clone)
  React.useEffect(() => {
    if (prefill?.queue) setQueueName(prefill.queue);
    if (prefill?.jobName) setJobName(prefill.jobName);
    if (prefill?.payload) setPayload(prefill.payload);
  }, [prefill?.queue, prefill?.jobName, prefill?.payload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!queueName || !jobName) {
      setResult({ success: false, message: "Queue and job name are required" });
      return;
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setResult({ success: false, message: "Invalid JSON payload" });
      return;
    }

    setResult(null);

    testJobMutation.mutate(
      {
        queueName,
        name: jobName,
        data: parsedPayload,
        delay: delay ? Number(delay) * 1000 : undefined,
      },
      {
        onSuccess: (response) => {
          setResult({
            success: true,
            message: `Job enqueued with ID: ${response.id}`,
          });
        },
        onError: (error) => {
          setResult({ success: false, message: error.message });
        },
      },
    );
  };

  if (readonly) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-lg font-medium">Test Mode Disabled</h2>
        <p className="max-w-md text-muted-foreground">
          The dashboard is in readonly mode. Job testing is disabled.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          Manually enqueue a job for testing purposes
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Queue Selection */}
        <div className="space-y-2">
          <label htmlFor="queue" className="text-sm font-medium">
            Queue
          </label>
          <Select value={queueName} onValueChange={setQueueName}>
            <SelectTrigger>
              <SelectValue placeholder="Select a queue" />
            </SelectTrigger>
            <SelectContent>
              {queues.map((queue) => (
                <SelectItem key={queue} value={queue}>
                  {queue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Name */}
        <div className="space-y-2">
          <label htmlFor="jobName" className="text-sm font-medium">
            Job Name
          </label>
          <input
            type="text"
            value={jobName}
            onChange={(e) => setJobName(e.target.value)}
            className="h-9 w-full border bg-background px-3 text-sm focus:outline-none"
            placeholder="my-job-name"
          />
        </div>

        {/* Delay */}
        <div className="space-y-2">
          <label htmlFor="delay" className="text-sm font-medium">
            Delay (seconds)
          </label>
          <input
            type="number"
            value={delay}
            onChange={(e) => setDelay(e.target.value)}
            className="h-9 w-full border bg-background px-3 text-sm focus:outline-none"
            placeholder="0"
            min="0"
          />
          <p className="text-xs text-muted-foreground">
            Optional delay before the job is processed
          </p>
        </div>

        {/* Payload */}
        <div className="space-y-2">
          <label htmlFor="payload" className="text-sm font-medium">
            Payload (JSON)
          </label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="h-48 w-full resize-none border bg-background px-3 py-2 font-mono text-sm focus:outline-none"
            placeholder='{ "key": "value" }'
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={testJobMutation.isPending}>
            {testJobMutation.isPending ? <>Processing...</> : <>Enqueue Job</>}
          </Button>

          {result && (
            <div
              className={cn(
                "flex items-center gap-2 text-sm",
                result.success ? "text-success" : "text-destructive",
              )}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {result.message}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
