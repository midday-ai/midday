import { getUser } from "@midday/supabase/cached-queries";
import { getVaultRecursiveQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { download } from "@midday/supabase/storage";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import type { NextRequest, NextResponse } from "next/server";

export const preferredRegion = ["fra1", "sfo1", "iad1"];
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, res: NextResponse) {
  const requestUrl = new URL(req.url);
  const supabase = createClient();
  const user = await getUser();
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  const promises: any = [];

  const files = await getVaultRecursiveQuery(supabase, {
    teamId: user.data.team_id,
    path,
  });

  files.forEach((file) => {
    promises.push(
      download(supabase, {
        bucket: "vault",
        path: `${file.basePath}/${file.name}`,
      }),
    );
  });

  const response = await Promise.allSettled(promises);

  const zipFileWriter = new BlobWriter("application/zip");
  const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true });

  const downloadedFiles = response.map((result, index) => {
    if (result.status === "fulfilled") {
      return {
        name: files[index].name,
        blob: result.value.data,
      };
    }
  });

  downloadedFiles.forEach((downloadedFile) => {
    if (downloadedFile?.blob) {
      zipWriter.add(downloadedFile.name, new BlobReader(downloadedFile.blob));
    }
  });

  const responseHeaders = new Headers(res.headers);

  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${filename}.zip"`,
  );

  const data = await zipWriter.close();

  return new Response(data, {
    headers: responseHeaders,
  });
}
