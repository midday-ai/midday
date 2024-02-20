"use server";

import { VisibilityState } from "@tanstack/react-table";
import { cookies } from "next/headers";

type Props = {
  key: string;
  data: VisibilityState;
};

export async function updateColumnVisibilityAction({ key, data }: Props) {
  cookies().set(key, JSON.stringify(data));

  return Promise.resolve(data);
}
