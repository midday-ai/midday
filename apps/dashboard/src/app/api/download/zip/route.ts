import { createClient } from "@midday/supabase/server";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";

export const preferredRegion = "fra1";
export const runtime = "edge";

export async function GET(req, res) {
  const promises = [];
  const supabase = createClient();
  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path");
  const filename = requestUrl.searchParams.get("filename");

  files.forEach((file) => {
    promises.push(
      supabaseClient.storage.from(bucket).download(`${folder}/${file.name}`)
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
    if (downloadedFile) {
      zipWriter.add(downloadedFile.name, new BlobReader(downloadedFile.blob));
    }
  });

  //   const { data } = await supabase.storage.from("vault").download(path);
  //   const responseHeaders = new Headers(res.headers);

  //   responseHeaders.set(
  //     "Content-Disposition",
  //     `attachment; filename="${filename}"`
  //   );

  //   return new Response(data, {
  //     headers: responseHeaders,
  //   });
}
