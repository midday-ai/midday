export function stripSpecialCharacters(inputString: string) {
  // Remove special characters and spaces, keep alphanumeric, hyphens/underscores, and dots
  return inputString
    .replace(/[^a-zA-Z0-9-_\s.]/g, "") // Remove special chars except hyphen/underscore/dot
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase for consistency
}

export { isValidEmail, isValidEmailList, parseEmailList } from "./email";
export {
  getDefaultFiscalYearStartMonth,
  getFiscalYearDates,
  getFiscalYearLabel,
  getFiscalYearToDate,
} from "./fiscal-year";
export {
  ensureFileExtension,
  getExtensionFromMimeType,
} from "./mime-to-extension";
export { sanitizeRedirectPath } from "./sanitize-redirect";
export {
  getDefaultTaxType,
  getTaxTypeForCountry,
  getTaxTypeLabel,
  isGSTCountry,
  isVATCountry,
  taxTypes,
} from "./tax";
