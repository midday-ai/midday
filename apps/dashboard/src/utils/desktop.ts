import { headers } from "next/headers";

export async function isDesktopApp() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  return userAgent?.includes("Midday Desktop App");
}
