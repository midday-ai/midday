export async function processPromisesBatch(
  items: Array<any>,
  limit: number,
  fn: (item: any) => Promise<any>
): Promise<any> {
  let results = [];
  for (let start = 0; start < items.length; start += limit) {
    const end = start + limit > items.length ? items.length : start + limit;

    const slicedResults = await Promise.all(items.slice(start, end).map(fn));

    results = [...results, ...slicedResults];
  }

  return results;
}
