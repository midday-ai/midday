export function isValidUrlFormat(urlString: string) {
  try {
    new URL(urlString);
    return true;
  } catch (_error) {
    return false;
  }
}

export function formatUrlWithProtocol(rawUrlString: string) {
  if (isValidUrlFormat(rawUrlString)) return rawUrlString;
  try {
    if (rawUrlString.includes(".") && !rawUrlString.includes(" ")) {
      return new URL(`https://${rawUrlString}`).toString();
    }
  } catch (_error) {
    return null;
  }
}
