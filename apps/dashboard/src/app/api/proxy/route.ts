export const runtime = "edge";

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  return fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${filePath}`,
    {
      headers: {
        authorization: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );
}
