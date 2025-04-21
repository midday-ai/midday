export async function blobToSerializable(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Array.from(new Uint8Array(arrayBuffer));
}

export function serializableToBlob(array: number[], contentType = "") {
  return new Blob([new Uint8Array(array)], { type: contentType });
}
