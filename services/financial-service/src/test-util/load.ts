/**
 * Executes a load test by invoking a specified asynchronous function at a given rate per second
 * for a set duration of time. It returns a promise that resolves to an array of responses from all the function invocations.
 *
 * @template TResponse - The expected type of the response returned by the provided function `fn`.
 *
 * @param {object} opts - The options for the load test.
 * @param {number} opts.rps - The number of requests per second (RPS) to execute. This controls how many times `fn` will be invoked per second.
 * @param {number} opts.seconds - The total duration of the load test in seconds. This controls how long the load test will run.
 * @param {() => Promise<TResponse>} opts.fn - An asynchronous function that returns a promise, which will be executed `rps` times per second.
 *
 * @returns {Promise<TResponse[]>} - A promise that resolves to an array containing the results of all the function invocations. Each element corresponds to one invocation of `fn`.
 *
 * @example
 * ```typescript
 * const result = await loadTest({
 *   rps: 5, // 5 requests per second
 *   seconds: 10, // for a total of 10 seconds
 *   fn: async () => {
 *     return await performSomeOperation(); // Replace with your async function
 *   },
 * });
 * console.log(result); // Array of results from all invocations of `fn`
 * ```
 */
export async function loadTest<TResponse>(opts: {
  rps: number;
  seconds: number;
  fn: () => Promise<TResponse>;
}): Promise<TResponse[]> {
  const promises: Promise<TResponse>[] = [];

  // Iterate over each second of the test duration
  for (let s = 0; s < opts.seconds; s++) {
    // For each second, invoke the provided function the specified number of times (rps)
    for (let r = 0; r < opts.rps; r++) {
      const p = opts.fn(); // Call the function and push its result (a promise) into the array
      promises.push(p);
    }
    // Wait for 1 second before starting the next iteration
    await new Promise((r) => setTimeout(r, 1_000));
  }

  // Return a promise that resolves when all function invocations have completed
  return Promise.all(promises);
}
