import { decode } from "base64-arraybuffer";
import convert from "heic-convert";
import { nanoid } from "nanoid";
import sharp from "sharp";
import type { Document, DocumentResponse } from "./types";

const MAX_SIZE = 1500;

export async function prepareDocument(
  document: Document
): Promise<DocumentResponse> {
  const buffer = decode(document.content);

  switch (document.mimeType) {
    case "application/pdf": {
      return {
        content: buffer,
        mimeType: "application/pdf",
        size: document.size,
        fileName: `${nanoid(10)}.pdf`,
      };
    }
    case "image/heic": {
      const decodedImage = await convert({
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
        fileName: `${nanoid(10)}.jpg`,
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
        fileName: `${nanoid(10)}.jpg`,
      };
    }
  }
}
