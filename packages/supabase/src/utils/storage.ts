import { SupabaseClient } from "@supabase/supabase-js";

export const EMPTY_FOLDER_PLACEHOLDER_FILE_NAME = ".emptyFolderPlaceholder";

type UploadParams = {
  file: File;
  path: string;
  bucket: string;
};

export async function upload(
  client: SupabaseClient,
  { file, path, bucket }: UploadParams
) {
  const storage = client.storage.from(bucket);
  const fullPath = `${path}/${file.name}`;

  const result = await storage.upload(fullPath, file, {
    upsert: true,
    cacheControl: "3600",
  });

  if (!result.error) {
    return storage.getPublicUrl(fullPath).data.publicUrl;
  }

  throw result.error;
}

type RemoveParams = {
  path: string;
  bucket: string;
};

export async function remove(
  client: SupabaseClient,
  { bucket, path }: RemoveParams
) {
  return client.storage.from(bucket).remove([path]);
}

type DeleteFolderParams = {
  path: string;
  bucket: string;
};

export async function deleteFolder(
  client: SupabaseClient,
  { bucket, path }: DeleteFolderParams
) {
  const { data: list } = await client.storage.from(bucket).list(path);
  const filesToRemove = list?.map((file) => `${path}/${file.name}`);
  return client.storage.from(bucket).remove([...filesToRemove, path]);
}

type CreateFolderParams = {
  path: string;
  name: string;
  bucket: string;
};

export async function createFolder(
  client: SupabaseClient,
  { bucket, path, name }: CreateFolderParams
) {
  const fullPath = `${path}/${name}/${EMPTY_FOLDER_PLACEHOLDER_FILE_NAME}`;

  const { error, data } = await client.storage
    .from(bucket)
    .upload(fullPath, new File([], EMPTY_FOLDER_PLACEHOLDER_FILE_NAME));

  if (error) {
    throw Error(error.message);
  }

  return data;
}

type DownloadParams = {
  path: string;
  bucket: string;
};

export async function download(
  client: SupabaseClient,
  { bucket, path }: DownloadParams
) {
  return client.storage.from(bucket).download(path);
}

type ShareParams = {
  path: string;
  bucket: string;
  expireIn: number;
  options?: {
    download?: boolean;
  };
};

export async function share(
  client: SupabaseClient,
  { bucket, path, expireIn, options }: ShareParams
) {
  return client.storage.from(bucket).createSignedUrl(path, expireIn, options);
}

// export async function getAllItemsAlongFolder(folder) {
//   const items = [];

//   let formattedPathToFolder = "";
//   const { name, columnIndex, prefix } = folder;

//   if (prefix === undefined) {
//     const pathToFolder = this.openedFolders
//       .slice(0, columnIndex)
//       .map((folder) => folder.name)
//       .join("/");
//     formattedPathToFolder =
//       pathToFolder.length > 0 ? `${pathToFolder}/${name}` : name;
//   } else {
//     formattedPathToFolder = `${prefix}/${name}`;
//   }

//   const options = {
//     limit: 10000,
//     offset: OFFSET,
//     sortBy: { column: this.sortBy, order: this.sortByOrder },
//   };
//   let folderContents = [];

//   for (;;) {
//     const res = await post(
//       `${this.endpoint}/buckets/${this.selectedBucket.name}/objects/list`,
//       {
//         path: formattedPathToFolder,
//         options,
//       }
//     );
//     folderContents = folderContents.concat(res);
//     options.offset += options.limit;
//     if ((res || []).length < options.limit) {
//       break;
//     }
//   }

//   const subfolders = folderContents?.filter((item) => item.id === null) ?? [];
//   const folderItems = folderContents?.filter((item) => item.id !== null) ?? [];

//   folderItems.forEach((item) =>
//     items.push({ ...item, prefix: formattedPathToFolder })
//   );

//   const subFolderContents = await Promise.all(
//     subfolders.map((folder) =>
//       this.getAllItemsAlongFolder({ ...folder, prefix: formattedPathToFolder })
//     )
//   );
//   subFolderContents.map((subfolderContent) => {
//     subfolderContent.map((item) => items.push(item));
//   });

//   return items;
// }
