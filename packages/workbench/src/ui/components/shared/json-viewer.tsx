import { Check, ChevronRight, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  className?: string;
  defaultExpanded?: boolean;
}

export function JsonViewer({
  data,
  className,
  defaultExpanded = true,
}: JsonViewerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded p-1.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
      >
        {copied ? (
          <Check size={16} className="h-4 w-4 text-status-success" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      <div className="max-h-96 overflow-auto p-4 font-mono text-sm">
        <JsonNode data={data} level={0} defaultExpanded={defaultExpanded} />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  data: unknown;
  level: number;
  defaultExpanded: boolean;
  keyName?: string;
}

function JsonNode({ data, level, defaultExpanded, keyName }: JsonNodeProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const KeyLabel = ({ name }: { name: string }) => (
    <span className="text-primary">"{name}"</span>
  );

  if (data === null) {
    return (
      <span>
        {keyName && (
          <>
            <KeyLabel name={keyName} />
            <span className="text-foreground">: </span>
          </>
        )}
        <span className="text-muted-foreground italic">null</span>
      </span>
    );
  }

  if (data === undefined) {
    return (
      <span>
        {keyName && (
          <>
            <KeyLabel name={keyName} />
            <span className="text-foreground">: </span>
          </>
        )}
        <span className="text-muted-foreground italic">undefined</span>
      </span>
    );
  }

  if (typeof data === "boolean") {
    return (
      <span>
        {keyName && (
          <>
            <KeyLabel name={keyName} />
            <span className="text-foreground">: </span>
          </>
        )}
        <span className="text-status-warning">{String(data)}</span>
      </span>
    );
  }

  if (typeof data === "number") {
    return (
      <span>
        {keyName && (
          <>
            <KeyLabel name={keyName} />
            <span className="text-foreground">: </span>
          </>
        )}
        <span className="text-status-success">{data}</span>
      </span>
    );
  }

  if (typeof data === "string") {
    return (
      <span>
        {keyName && (
          <>
            <KeyLabel name={keyName} />
            <span className="text-foreground">: </span>
          </>
        )}
        <span className="text-chart-5">"{data}"</span>
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <span>
          {keyName && (
            <>
              <KeyLabel name={keyName} />
              <span className="text-foreground">: </span>
            </>
          )}
          <span className="text-muted-foreground">[]</span>
        </span>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 hover:opacity-70"
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
          {keyName && (
            <>
              <KeyLabel name={keyName} />
              <span className="text-foreground">: </span>
            </>
          )}
          <span className="text-muted-foreground">Array({data.length})</span>
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
            {data.map((item, index) => (
              <div key={index.toString()}>
                <JsonNode
                  data={item}
                  level={level + 1}
                  defaultExpanded={level < 1}
                  keyName={String(index)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === "object") {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      return (
        <span>
          {keyName && (
            <>
              <KeyLabel name={keyName} />
              <span className="text-foreground">: </span>
            </>
          )}
          <span className="text-muted-foreground">{"{}"}</span>
        </span>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 hover:opacity-70"
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
          {keyName && (
            <>
              <KeyLabel name={keyName} />
              <span className="text-foreground">: </span>
            </>
          )}
          <span className="text-muted-foreground">
            Object({entries.length})
          </span>
        </button>
        {expanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
            {entries.map(([key, value]) => (
              <div key={key}>
                <JsonNode
                  data={value}
                  level={level + 1}
                  defaultExpanded={level < 1}
                  keyName={key}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span>{String(data)}</span>;
}
