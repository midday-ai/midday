export async function loadTest<TResponse>(opts: {
  rps: number;
  seconds: number;
  fn: () => Promise<TResponse>;
}): Promise<TResponse[]> {
  const promises: Promise<TResponse>[] = [];

  for (let s = 0; s < opts.seconds; s++) {
    for (let r = 0; r < opts.rps; r++) {
      const p = opts.fn();
      promises.push(p);
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }

  return Promise.all(promises);
}
