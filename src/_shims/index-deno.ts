import { MultipartBody } from './MultipartBody';
import { type RequestOptions } from '../core';

export const kind: string = 'web';

export type Agent = any;

const _fetch = fetch;
type _fetch = typeof fetch;
export { _fetch as fetch };

const _Request = Request;
type _Request = Request;
export { _Request as Request };

type _RequestInfo = RequestInfo;
export { type _RequestInfo as RequestInfo };

type _RequestInit = RequestInit;
export { type _RequestInit as RequestInit };

const _Response = Response;
type _Response = Response;
export { _Response as Response };

type _ResponseInit = ResponseInit;
export { type _ResponseInit as ResponseInit };

type _ResponseType = ResponseType;
export { type _ResponseType as ResponseType };

type _BodyInit = BodyInit;
export { type _BodyInit as BodyInit };

const _Headers = Headers;
type _Headers = Headers;
export { _Headers as Headers };

type _HeadersInit = HeadersInit;
export { type _HeadersInit as HeadersInit };

type EndingType = 'native' | 'transparent';

export interface BlobPropertyBag {
  endings?: EndingType;
  type?: string;
}

export interface FilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
}

export type FileFromPathOptions = Omit<FilePropertyBag, 'lastModified'>;

const _FormData = FormData;
type _FormData = FormData;
export { _FormData as FormData };

const _File = File;
type _File = File;
export { _File as File };

const _Blob = Blob;
type _Blob = Blob;
export { _Blob as Blob };

export async function getMultipartRequestOptions<T = Record<string, unknown>>(
  form: FormData,
  opts: RequestOptions<T>,
): Promise<RequestOptions<T>> {
  return {
    ...opts,
    body: new MultipartBody(form) as any,
  };
}

export function getDefaultAgent(url: string) {
  return undefined;
}
export function fileFromPath() {
  throw new Error(
    'The `fileFromPath` function is only supported in Node. See the README for more details: https://www.github.com/midday-ai/midday#file-uploads',
  );
}

export const isFsReadStream = (value: any) => false;

export declare class Readable {
  readable: boolean;
  readonly readableEnded: boolean;
  readonly readableFlowing: boolean | null;
  readonly readableHighWaterMark: number;
  readonly readableLength: number;
  readonly readableObjectMode: boolean;
  destroyed: boolean;
  read(size?: number): any;
  pause(): this;
  resume(): this;
  isPaused(): boolean;
  destroy(error?: Error): this;
  [Symbol.asyncIterator](): AsyncIterableIterator<any>;
}

export declare class FsReadStream extends Readable {
  path: {}; // node type is string | Buffer
}

const _ReadableStream = ReadableStream;
type _ReadableStream = ReadableStream;
export { _ReadableStream as ReadableStream };
