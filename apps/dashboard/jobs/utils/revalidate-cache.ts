export async function revalidateCache({
  tag,
  teamId,
}: {
  tag: string;
  teamId: string;
}) {
  return fetch(
    `${process.env.MIDDAY_PUBLIC_APP_URL}/api/webhook/cache/revalidate`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MIDDAY_CACHE_API_SECRET}`,
      },
      method: "POST",
      body: JSON.stringify({ tag, teamId }),
    },
  );
}
