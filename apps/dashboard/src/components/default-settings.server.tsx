import { getTimezone } from "@midday/location";
import { getLocale } from "@midday/location";
import { getDateFormat } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";

export async function DefaultSettings() {
  const supabase = await createClient();

  const locale = await getLocale();
  const timezone = await getTimezone();
  const dateFormat = await getDateFormat();

  try {
    const user = await getUser();

    const { id, date_format } = user?.data ?? {};

    // Set default date format if not set
    if (!date_format && id) {
      await supabase
        .from("users")
        .update({
          date_format: dateFormat,
          timezone,
          locale,
        })
        .eq("id", id);
    }
  } catch (error) {
    console.error(error);
  }

  return null;
}
