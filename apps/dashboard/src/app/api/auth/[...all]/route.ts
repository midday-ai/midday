import { getAuth } from "@midday/auth/server";
import { isLocalBackend } from "@midday/utils/backend";

async function handler(request: Request) {
  if (!isLocalBackend()) return new Response("Not found", { status: 404 });
  return (await getAuth()).handler(request);
}

export { handler as GET, handler as POST };
