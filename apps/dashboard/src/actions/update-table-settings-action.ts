"use server";

import { addYears } from "date-fns";
import { cookies } from "next/headers";

type Props = {
  key: string;
  data: unknown;
};

export async function updateTableSettingsAction({ key, data }: Props) {
  (await cookies()).set(key, JSON.stringify(data), {
    expires: addYears(new Date(), 10), // 10 years - as long as practical
  });

  return Promise.resolve(data);
}
