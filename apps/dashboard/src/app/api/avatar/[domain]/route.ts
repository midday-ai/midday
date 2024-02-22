import getMetadata from "url-metadata";

export const runtime = "edge";

const getFaviconURL = ({ href, url }) => {
  if (href?.startsWith("http")) {
    return href;
  }

  const link = new URL(url);

  link.pathname = href;

  return link.toString();
};

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const domain = requestUrl.searchParams.get("domain");

  const { url, favicons } = await getMetadata(`http://${domain}`);

  const favicon = favicons
    .sort((a, b) => b?.sizes?.split("x")?.at(0) - a?.sizes?.split("x")?.at(0))
    ?.at(0);

  const link = getFaviconURL({ href: favicon?.href, url });
  const logo = await (await fetch(link)).arrayBuffer();

  return new Response(logo, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
}
