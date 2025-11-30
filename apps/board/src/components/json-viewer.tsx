"use client";

import { useMemo } from "react";

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

function formatJsonString(value: unknown, indent = 0): string {
  const indentStr = "  ".repeat(indent);

  if (value === null) {
    return "null";
  }

  if (typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const items = value.map(
      (item, index) =>
        `${indentStr}  ${formatJsonString(item, indent + 1)}${index < value.length - 1 ? "," : ""}`,
    );
    return `[\n${items.join("\n")}\n${indentStr}]`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return "{}";
    }
    const items = entries.map(
      ([key, val], index) =>
        `${indentStr}  ${JSON.stringify(key)}: ${formatJsonString(val, indent + 1)}${index < entries.length - 1 ? "," : ""}`,
    );
    return `{\n${items.join("\n")}\n${indentStr}}`;
  }

  return String(value);
}

function highlightJson(json: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let partIndex = 0;

  while (i < json.length) {
    // Match keys (quoted strings followed by colon)
    const keyMatch = json.slice(i).match(/^"([^"\\]|\\.)*":\s*/);
    if (keyMatch) {
      parts.push(
        <span
          key={`part-${partIndex++}`}
          className="text-[#878787] dark:text-[#666666]"
        >
          {keyMatch[0]}
        </span>,
      );
      i += keyMatch[0].length;
      continue;
    }

    // Match string values (quoted strings not followed by colon)
    const stringMatch = json.slice(i).match(/^"([^"\\]|\\.)*"/);
    if (stringMatch) {
      parts.push(
        <span key={`part-${partIndex++}`} className="text-foreground">
          {stringMatch[0]}
        </span>,
      );
      i += stringMatch[0].length;
      continue;
    }

    // Match numbers
    const numberMatch = json.slice(i).match(/^-?\d+\.?\d*/);
    if (numberMatch) {
      parts.push(
        <span key={`part-${partIndex++}`} className="text-foreground">
          {numberMatch[0]}
        </span>,
      );
      i += numberMatch[0].length;
      continue;
    }

    // Match null, true, false
    const literalMatch = json.slice(i).match(/^(null|true|false)\b/);
    if (literalMatch) {
      parts.push(
        <span
          key={`part-${partIndex++}`}
          className="text-[#878787] dark:text-[#666666]"
        >
          {literalMatch[0]}
        </span>,
      );
      i += literalMatch[0].length;
      continue;
    }

    // Match brackets and punctuation
    const char = json[i];
    if (char && ["{", "}", "[", "]", ",", ":"].includes(char)) {
      parts.push(
        <span
          key={`part-${partIndex++}`}
          className="text-[#878787] dark:text-[#666666]"
        >
          {char}
        </span>,
      );
      i++;
      continue;
    }

    // Default: regular text
    parts.push(
      <span key={`part-${partIndex++}`} className="text-foreground">
        {char}
      </span>,
    );
    i++;
  }

  return parts;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  const formatted = useMemo(() => {
    try {
      const json = formatJsonString(data, 0);
      return highlightJson(json);
    } catch {
      return [<span key="error">{String(data)}</span>];
    }
  }, [data]);

  return (
    <div
      className={`text-xs font-mono border border-border p-4 overflow-auto leading-relaxed ${className || ""}`}
    >
      <pre className="text-foreground whitespace-pre-wrap break-words font-mono text-xs">
        {formatted}
      </pre>
    </div>
  );
}
