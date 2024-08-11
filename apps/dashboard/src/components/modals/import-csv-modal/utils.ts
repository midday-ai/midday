import { truncate } from "@midday/ui/truncate";

const maxColumns = 4;

export const listColumns = (columns: string[]) => {
  const eachTruncated = columns.map((column) => truncate(column, 16));
  const allTruncated =
    eachTruncated.length <= maxColumns
      ? eachTruncated
      : eachTruncated
          .slice(0, maxColumns)
          .concat(`and ${eachTruncated.length - maxColumns} more`);
  return allTruncated.join(", ");
};

export const readLines = async (file: File, count = 4): Promise<string> => {
  const reader = file.stream().getReader();
  const decoder = new TextDecoder("utf-8");
  let { value: chunk, done: readerDone } = await reader.read();
  let content = "";
  const result: string[] = [];

  while (!readerDone) {
    content += decoder.decode(chunk, { stream: true });
    const lines = content.split("\n");
    if (lines.length >= count) {
      reader.cancel();
      return lines.slice(0, count).join("\n");
    }
    ({ value: chunk, done: readerDone } = await reader.read());
  }

  return result.join("\n");
};
