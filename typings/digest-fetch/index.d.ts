declare module 'digest-fetch';

import type { RequestInfo, RequestInit, Response } from 'node-fetch';

type Algorithm = 'MD5' | 'MD5-sess';

type Options = {
  algorithm?: Algorithm;
  statusCode?: number;
  cnonceSize?: number;
  basic?: boolean;
  precomputeHash?: boolean;
  logger?: typeof console;
};

class DigestClient {
  user: string;
  password: string;

  private nonceRaw: string;
  private logger?: typeof console;
  private precomputedHash?: boolean;
  private statusCode?: number;
  private basic: boolean;
  private cnonceSize: number;
  private hasAuth: boolean;
  private digest: { nc: number; algorithm: Algorithm; realm: string };

  constructor(user: string, password: string, options: Options = {});
  async fetch(url: RequestInfo, options: RequestInit = {}): Promise<Response>;
}

export default DigestClient;
