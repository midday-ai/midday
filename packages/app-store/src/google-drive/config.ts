import { Logo } from "./assets/logo";

export default {
  name: "Google Drive",
  id: "googledrive",
  category: "Productivity",
  active: true,
  logo: Logo,
  short_description:
    "Automatically import receipts and invoices from your Google Drive folders. Midday extracts data and matches them to transactions.",
  description:
    "Connect your Google Drive account to automatically sync receipts and invoices from selected folders. We support PDF files and images (JPEG, PNG, WebP, HEIC, HEIF) up to 10MB. Initially, we'll sync the first 50 items from your selected folders. Files are processed using OCR and matched to your transactions.",
  images: [],
  onInitialize: () => {},
  settings: {},
  config: {},
};
