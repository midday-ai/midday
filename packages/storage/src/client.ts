export type UploadProgress = { loaded: number; total: number; percent: number };
export type PutWithProgressOptions = {
  headers: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
};

/** Upload a browser Blob using exactly the headers returned by the signing endpoint. */
export function putWithProgress(
  url: string,
  file: Blob,
  options: PutWithProgressOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const aborted = () => new DOMException("Upload aborted", "AbortError");
    const cleanup = () => options.signal?.removeEventListener("abort", onAbort);
    const onAbort = () => {
      xhr.abort();
      cleanup();
      reject(aborted());
    };
    if (options.signal?.aborted) {
      reject(aborted());
      return;
    }
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(options.headers))
      xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      const total = event.lengthComputable ? event.total : file.size;
      options.onProgress?.({
        loaded: event.loaded,
        total,
        percent: total > 0 ? Math.min(100, (event.loaded / total) * 100) : 0,
      });
    };
    xhr.onload = () => {
      cleanup();
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Storage upload failed (${xhr.status})`));
        return;
      }
      options.onProgress?.({
        loaded: file.size,
        total: file.size,
        percent: 100,
      });
      resolve();
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error("Storage upload failed: network error"));
    };
    xhr.onabort = () => {
      cleanup();
      reject(aborted());
    };
    options.signal?.addEventListener("abort", onAbort, { once: true });
    xhr.send(file);
  });
}
