import { getQueryClient, trpc } from "@/trpc/server";
import { formatSize } from "@/utils/format";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ shortId: string }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Page({ params }: Props) {
  const { shortId } = await params;

  const queryClient = getQueryClient();

  const shortLink = await queryClient.fetchQuery(
    trpc.shortLinks.get.queryOptions({ shortId }),
  );

  if (!shortLink?.url) {
    notFound();
  }

  if (shortLink.expiresAt && new Date(shortLink.expiresAt) < new Date()) {
    notFound();
  }

  if (shortLink.type === "redirect")
    try {
      redirect(shortLink.url);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }

      notFound();
    }

  return (
    <div className="h-screen p-2">
      <header className="absolute top-0 left-0 z-30 w-full">
        <div className="p-6 md:p-8">
          <Icons.LogoSmall className="h-8 w-auto" />
        </div>
      </header>

      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-[400px]">
          <div className="text-center">
            <h1 className="text-lg mb-2 font-serif">Download File</h1>

            <p className="text-[#878787] text-sm mb-8">
              {shortLink.teamName} has shared a file with you
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-b-[1px] border-border mb-4 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {shortLink.fileName?.split("/").pop() ?? "File"}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {shortLink.size && formatSize(shortLink.size)}
                </p>
              </div>
            </div>

            <a href={shortLink.url} rel="noreferrer" download>
              <Button className="w-full mt-6" size="lg">
                <div className="flex items-center space-x-2">
                  <span>Download File</span>
                  <Icons.ArrowCoolDown className="size-4" />
                </div>
              </Button>
            </a>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            This download link is secure and will expire.
          </p>
        </div>
      </div>
    </div>
  );
}
