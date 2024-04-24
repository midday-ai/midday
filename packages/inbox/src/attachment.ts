import { stripSpecialCharacters } from "@midday/utils";
import { decode } from "base64-arraybuffer";
import convert from "heic-convert";
import { nanoid } from "nanoid";
import sharp from "sharp";

type Attachment = {
  content: string;
  contentType: string;
  size: number;
};

type GenereateFileNameParams = {
  fileName: string;
  type: "pdf" | "jpg";
};

const MAX_SIZE = 1500;

export async function generateAttachment(attachment: Attachment) {
  const attachmentBuffer = decode(attachment.content);

  switch (attachment.contentType) {
    case "application/pdf": {
      return {
        content: attachmentBuffer,
        contentType: attachment.contentType,
        size: attachment.size,
        fileName: `${nanoid(10)}.pdf`,
      };
    }
    case "image/heic": {
      const buffer = new Uint8Array(attachmentBuffer);

      const decodedImage = await convert({
        buffer,
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
        contentType: "image/jpeg",
        size: image.byteLength,
        fileName: `${nanoid(10)}.jpg`,
      };
    }
    default: {
      const image = await sharp(attachmentBuffer)
        .rotate()
        .resize({ width: MAX_SIZE })
        .toFormat("jpeg")
        .toBuffer();

      return {
        content: image,
        contentType: "image/jpeg",
        size: image.byteLength,
        fileName: generateFileName({ fileName, type: "jpg" }),
      };
    }
  }
}
