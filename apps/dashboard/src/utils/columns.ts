import { cookies } from "next/headers";
import { Cookies } from "./constants";

export async function getInitialColumnVisibility() {
  const cookieStore = await cookies();

  const columnsToHide = ["assigned", "tags", "method"];
  const savedColumns = cookieStore.get(Cookies.TransactionsColumns)?.value;
  return savedColumns
    ? JSON.parse(savedColumns)
    : columnsToHide.reduce(
        (acc, col) => {
          acc[col] = false;
          return acc;
        },
        {} as Record<string, boolean>,
      );
}
