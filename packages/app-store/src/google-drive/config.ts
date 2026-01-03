import { Logo } from "./assets/logo";

export default {
  name: "Google Drive",
  id: "google-drive",
  category: "Inbox",
  active: true,
  logo: Logo,
  short_description:
    "Watch a folder for receipts and invoices. Files are automatically imported and matched to transactions.",
  description:
    "Automatically import receipts and invoices from a Google Drive folder. Perfect for scanning documents on your phone and having them synced to Midday.\n\n**Folder Watching**\nSelect any folder in your Google Drive to watch for new files. When you add a receipt or invoice, it's automatically imported to your inbox.\n\n**Smart Processing**\nDocuments are processed using AI to extract key information like amounts, dates, and vendor details, then matched to corresponding transactions.\n\n**Supported Files**\nPDF documents and images (JPEG, PNG, GIF, WebP) up to 10MB are supported.",
  images: [require("./assets/drive.jpg")],
  settings: {
    installUrl: "/apps/google-drive/install-url",
  },
};
