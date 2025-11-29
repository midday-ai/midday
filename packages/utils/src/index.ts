export function stripSpecialCharacters(inputString: string) {
  // Remove special characters and spaces, keep alphanumeric, hyphens/underscores, and dots
  return inputString
    .replace(/[^a-zA-Z0-9-_\s.]/g, "") // Remove special chars except hyphen/underscore/dot
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase(); // Convert to lowercase for consistency
}

export {
  getExtensionFromMimeType,
  ensureFileExtension,
} from "./mime-to-extension";

export {
  taxTypes,
  getTaxTypeLabel,
  getDefaultTaxType,
  getTaxTypeForCountry,
  isVATCountry,
  isGSTCountry,
} from "./tax";

export {
  getDefaultFiscalYearStartMonth,
  getFiscalYearLabel,
  getFiscalYearDates,
  getFiscalYearToDate,
} from "./fiscal-year";
