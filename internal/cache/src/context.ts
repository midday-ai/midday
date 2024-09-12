export interface Context {
  waitUntil: (p: Promise<unknown>) => void;
}

export class DefaultStatefulContext implements Context {
  public waitUntil<TPromise = unknown>(_p: Promise<TPromise>) {
    // do nothing, the promise will resolve on its own
  }
}
