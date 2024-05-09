import { stripSpecialCharacters } from "@midday/utils";
import { decode } from "base64-arraybuffer";
import convert from "heic-convert";
import sharp from "sharp";
import type { Document, DocumentResponse } from "./types";

const MAX_SIZE = 1500;

export async function prepareDocument(
  document: Document
): Promise<DocumentResponse> {
  const buffer = decode(document.Content);
  const fileName = document.Name.split(".")?.at(0);
  const sanitizedName = stripSpecialCharacters(fileName);

  switch (document.ContentType) {
    case "application/octet-stream":
    case "application/pdf": {
      return {
        content: buffer,
        mimeType: "application/pdf",
        size: document.ContentLength,
        fileName: `${sanitizedName}.pdf`,
      };
    }
    case "image/heic": {
      const decodedImage = await convert({
        // @ts-ignore
        buffer: new Uint8Array(buffer),
        format: "JPEG",
        quality: 1,
      });

      const image = await sharp(decodedImage)
        .rotate()
        .resize({ width: MAX_SIZE })
        .toFormat("jpeg")
        .toBuffer();

      return {
        content: image,
        mimeType: "image/jpeg",
        size: image.byteLength,
        fileName: `${sanitizedName}.jpg`,
      };
    }
    default: {
      const image = await sharp(buffer)
        .rotate()
        .resize({ width: MAX_SIZE })
        .toFormat("jpeg")
        .toBuffer();

      return {
        content: image,
        mimeType: "image/jpeg",
        size: image.byteLength,
        fileName: `${sanitizedName}.jpg`,
      };
    }
  }
}
