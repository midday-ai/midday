import { sha256 } from "@internal/hash";

import { KeyV1 } from "./v1";

export async function newKey(opts: {
  prefix?: string;
  byteLength: number;
}): Promise<{
  key: string;
  hash: string;
  start: string;
}> {
  const key = new KeyV1({
    byteLength: opts.byteLength,
    prefix: opts.prefix!,
  }).toString();
  const start = key.slice(0, (opts.prefix?.length ?? 0) + 5);
  const hash = await sha256(key);

  return { key, hash, start };
}
