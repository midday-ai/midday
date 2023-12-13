export const runtime = "edge";

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const filePath = requestUrl.searchParams.get("filePath");

  console.log(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${filePath}`
  );

  return fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${filePath}`,
    {
      headers: {
        // TODO: Use current user token instead
        authorization: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    }
  );
}
