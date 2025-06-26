import { getQueryClient, trpc } from "@/trpc/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ shortId: string }>;
};

export default async function Page({ params }: Props) {
  const { shortId } = await params;

  try {
    const queryClient = getQueryClient();

    // Fetch the short link data server-side
    const shortLink = await queryClient.fetchQuery(
      trpc.shortLinks.get.queryOptions({ shortId }),
    );

    if (!shortLink?.url) {
      notFound();
    }

    // Server-side redirect to the original URL
    redirect(shortLink.url);
  } catch (error) {
    // Check if it's a Next.js redirect (expected behavior)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }

    console.error("Error fetching short link:", error);
    notFound();
  }
}
