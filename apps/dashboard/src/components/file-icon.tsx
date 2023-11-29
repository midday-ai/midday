import { Icons } from "@midday/ui/icons";

export function FileIcon({ mimetype, name, isFolder }) {
  if (name === "exports") {
    return <Icons.DriveFileMove size={16} className="text-[#878787]" />;
  }

  if (name === "inbox") {
    return <Icons.FolderSpecial size={16} className="text-[#878787]" />;
  }

  if (name === "transactions") {
    return <Icons.Topic size={16} className="text-[#878787]" />;
  }

  if (mimetype?.startsWith("image")) {
    return <Icons.BrokenImage size={16} className="text-[#878787]" />;
  }

  if (isFolder) {
    return <Icons.Folder size={16} className="text-[#878787]" />;
  }

  switch (mimetype) {
    case "application/pdf":
      return <Icons.Pdf size={16} className="text-[#878787]" />;
    case "application/zip":
      return <Icons.FolderZip size={16} className="text-[#878787]" />;
    default:
      return <Icons.Description size={16} className="text-[#878787]" />;
  }
}
