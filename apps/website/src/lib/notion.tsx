import "server-only";

import { createBlockRenderer } from "@notion-render/client";
import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  ImageBlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import Image from "next/image";

export const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  fetch: (url, init) =>
    fetch(url, {
      ...init,
      next: {
        revalidate: 900,
      },
    }),
});

export const fetchPages = () => {
  return notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    sorts: [
      {
        timestamp: "created_time",
        direction: "ascending",
      },
    ],
    filter: {
      property: "Status",
      select: {
        equals: process.env.NODE_ENV === "development" ? "Draft" : "Published",
      },
    },
  });
};

export const fetchPageBySlug = (slug: string) => {
  return notion.databases
    .query({
      database_id: process.env.NOTION_DATABASE_ID!,
      filter: {
        property: "Slug",
        rich_text: {
          equals: slug,
        },
      },
    })
    .then((res) => res.results[0] as PageObjectResponse | undefined);
};

export const fetchPageBlocks = (pageId: string) => {
  return notion.blocks.children
    .list({ block_id: pageId })
    .then((res) => res.results as BlockObjectResponse[]);
};

export const imageRenderer = createBlockRenderer<ImageBlockObjectResponse>(
  "image",
  async (data, renderer) => {
    const src =
      "file" in data.image ? data.image.file.url : data.image.external.url;

    return `<Image src="${src}" height="400" alt="Image" />`;

    // return <Image  height={400} />;

    // return `
    //         <figure class="notion-${data.type}">
    //             <img src="${src}" />
    //             ${
    //               data.image.caption.length > 0
    //                 ? `<legend>${await renderer.render(
    //                     ...data.image.caption
    //                   )}</legend>`
    //                 : ""
    //             }
    //         </figure>
    //     `;
  }
);
