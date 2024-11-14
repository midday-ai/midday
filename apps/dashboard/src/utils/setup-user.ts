import { getDateFormat, getLocale, getTimezone } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import { createClient } from "@midday/supabase/server";

export async function setupUser(userId: string) {
  const supabase = createClient();

  const locale = getLocale();
  const timezone = getTimezone();
  const dateFormat = getDateFormat();

  try {
    const user = await getUser();

    // Set timezone if not set
    if (!user?.data?.date_format) {
      await supabase
        .from("users")
        .update({
          date_format: dateFormat,
          timezone,
          locale,
        })
        .eq("id", userId);
    }
  } catch (error) {
    console.error(error);
  }
}
