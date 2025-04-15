export function getWebsiteLogo(website?: string | null) {
  if (!website) return "";

  return `https://img.logo.dev/${website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=180&retina=true`;
}
