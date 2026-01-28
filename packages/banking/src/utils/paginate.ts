type PaginateOptions<T> = {
  pageSize: number;
  fetchData: (offset: number, count: number) => Promise<T[]>;
  delay?: {
    milliseconds: number;
    onDelay?: (message: string) => void;
  };
};

export async function paginate<T>({
  pageSize,
  fetchData,
  delay,
}: PaginateOptions<T>): Promise<T[]> {
  let allData: T[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    if (delay && offset > 0) {
      delay.onDelay?.(`Waiting ${delay.milliseconds}ms before next page...`);
      await new Promise((resolve) => setTimeout(resolve, delay.milliseconds));
    }

    const pageData = await fetchData(offset, pageSize);
    allData = allData.concat(pageData);

    if (pageData.length < pageSize) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  return allData;
}
