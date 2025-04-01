import { getUser } from "@midday/supabase/cached-queries";
import { getVaultRecursiveQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { download } from "@midday/supabase/storage";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import type { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
  const requestUrl = new URL(req.url);
  const supabase = await createClient();
  const user = await getUser();
  const folder = requestUrl.searchParams.get("folder") || "";

  if (!user?.data) {
    return new Response("Unauthorized", { status: 401 });
  }

  const promises: Promise<any>[] = [];

  const files = await getVaultRecursiveQuery(supabase, {
    teamId: user.data.team_id,
    folder,
  });

  for (const file of files) {
    promises.push(
      download(supabase, {
        bucket: "vault",
        path: file.name,
      }),
    );
  }

  const response = await Promise.allSettled(promises);

  const zipFileWriter = new BlobWriter("application/zip");
  const zipWriter = new ZipWriter(zipFileWriter, { bufferedWrite: true });

  const downloadedFiles = response
    .map((result, index) => {
      if (result.status === "fulfilled") {
        const fullPath = files[index].name;
        const pathFromFolder = folder
          ? fullPath.substring(fullPath.indexOf(folder))
          : fullPath;
        return {
          name: pathFromFolder,
          blob: result.value.data,
        };
      }
      return null;
    })
    .filter(
      (file): file is { name: string; blob: Blob } =>
        file !== null && !!file.blob,
    );

  for (const downloadedFile of downloadedFiles) {
    if (downloadedFile?.blob) {
      zipWriter.add(downloadedFile.name, new BlobReader(downloadedFile.blob));
    }
  }

  const responseHeaders = new Headers(res.headers);

  responseHeaders.set(
    "Content-Disposition",
    `attachment; filename="${folder}.zip"`,
  );

  const data = await zipWriter.close();

  return new Response(data, {
    headers: responseHeaders,
  });
}
