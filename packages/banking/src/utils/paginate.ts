export async function paginate<TData>({
  fetchData,
  pageSize,
  delay,
}: {
  fetchData: (offset: number, count: number) => Promise<TData[]>;
  pageSize: number;
  delay?: { onDelay: (message: string) => void; milliseconds: number };
}): Promise<TData[]> {
  const result: TData[] = [];
  let offset = 0;
  let data: TData[] = [];

  do {
    data = await fetchData(offset, pageSize);

    result.push(...data);

    offset += pageSize;

    if (delay && data.length >= pageSize) {
      delay.onDelay(`Waiting ${delay.milliseconds / 1000} seconds`);
      await new Promise((resolve) => setTimeout(resolve, delay.milliseconds));
    }
  } while (data.length >= pageSize);

  return result;
}
