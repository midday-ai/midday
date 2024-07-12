export const getFileExtension = (url: string) => {
  return url.split(".").pop();
};
