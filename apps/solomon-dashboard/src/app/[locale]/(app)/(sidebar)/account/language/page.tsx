import { ChangeLanguage } from "@/components/change-language";
import { WeekSettings } from "@/components/week-settings";
import { getUser } from "@midday/supabase/cached-queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Language & region | Solomon AI",
};

export default async function Language() {
  const { data: userData } = await getUser();

  return (
    <div className="space-y-12">
      <ChangeLanguage />
      <WeekSettings weekStartsOnMonday={userData?.week_starts_on_monday} />
    </div>
  );
}
