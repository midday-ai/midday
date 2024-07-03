"use server";

import type { VisibilityState } from "@tanstack/react-table";
import { addYears } from "date-fns";
import { cookies } from "next/headers";

type Props = {
  key: string;
  data: VisibilityState;
};

export async function updateColumnVisibilityAction({ key, data }: Props) {
  cookies().set(key, JSON.stringify(data), {
    expires: addYears(new Date(), 1),
  });

  return Promise.resolve(data);
}
