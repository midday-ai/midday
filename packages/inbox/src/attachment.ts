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

export async function generateAttachment(attachment: Attachment) {
  const attachmentBuffer = decode(attachment.content);

  if (attachment.contentType === "application/pdf") {
    return {
      content: attachmentBuffer,
      contentType: attachment.contentType,
      size: attachment.size,
      fileName: `${nanoid(10)}.pdf`,
    };
  }

  if (attachment.contentType === "image/heic") {
    const buffer = new Uint8Array(attachmentBuffer);

    const decodedImage = await convert({
      buffer,
      format: "JPEG",
      quality: 1,
    });

    const image = await sharp(decodedImage)
      .rotate()
      .resize({ width: 1500 })
      .toFormat("jpeg")
      .toBuffer();

    return {
      content: image,
      contentType: "image/jpeg",
      size: image.byteLength,
      fileName: `${nanoid(10)}.jpg`,
    };
  }

  const image = await sharp(attachmentBuffer)
    .rotate()
    .resize({ width: 1500 })
    .toFormat("jpeg")
    .toBuffer();

  return {
    content: image,
    contentType: "image/jpeg",
    size: image.byteLength,
    fileName: generateFileName({ fileName, type: "jpg" }),
  };
}
