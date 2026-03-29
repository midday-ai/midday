import type { FileUIPart } from "ai";

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function filesToUIParts(files: File[]): Promise<FileUIPart[]> {
  return Promise.all(
    files.map(async (file) => ({
      type: "file" as const,
      mediaType: file.type,
      filename: file.name,
      url: await readFileAsDataURL(file),
    })),
  );
}
