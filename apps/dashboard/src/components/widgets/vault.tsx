import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { BaseWidget } from "./base";
import { WIDGET_POLLING_CONFIG } from "./widget-config";
import { WidgetSkeleton } from "./widget-skeleton";

export function VaultWidget() {
  const trpc = useTRPC();
  const router = useRouter();

  // Fetch recent document activity
  const { data, isLoading } = useQuery({
    ...trpc.widgets.getVaultActivity.queryOptions({ limit: 3 }),
    ...WIDGET_POLLING_CONFIG,
  });

  if (isLoading) {
    return (
      <WidgetSkeleton
        title="File Management"
        icon={<Icons.Vault className="size-4" />}
        showValue={false}
      />
    );
  }

  const documents = data?.result?.data ?? [];
  const totalDocuments = data?.result?.total ?? 0;

  const handleOpenVault = () => {
    router.push("/vault");
  };

  const getActivityMessage = () => {
    if (totalDocuments === 0) {
      return "No documents yet";
    }

    if (totalDocuments === 1) {
      const doc = documents[0];
      const timeAgo = doc?.createdAt
        ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })
        : "";

      // Check if document has been classified and get the classification
      const hasClassification =
        doc?.documentTagAssignments && doc.documentTagAssignments.length > 0;
      const isProcessed = doc?.processingStatus === "completed";

      if (hasClassification) {
        const classification =
          doc.documentTagAssignments[0]?.documentTag?.name || "document";
        return `1 file automatically categorized as ${classification.toLowerCase()} ${timeAgo}`;
      }

      if (isProcessed) {
        return `1 file processed ${timeAgo}`;
      }

      return `1 file uploaded ${timeAgo}`;
    }

    // For multiple documents, show classifications
    const classifiedDocs = documents.filter(
      (doc) =>
        doc.processingStatus === "completed" ||
        (doc.documentTagAssignments && doc.documentTagAssignments.length > 0),
    );

    if (classifiedDocs.length === 0) {
      return `${totalDocuments} files uploaded`;
    }

    // Get unique classifications from the classified documents
    const classifications = new Set<string>();
    for (const doc of classifiedDocs) {
      if (doc.documentTagAssignments && doc.documentTagAssignments.length > 0) {
        for (const assignment of doc.documentTagAssignments) {
          if (assignment.documentTag?.name) {
            classifications.add(assignment.documentTag.name.toLowerCase());
          }
        }
      }
    }

    const classificationArray = Array.from(classifications);

    if (classificationArray.length === 0) {
      return `${classifiedDocs.length} files automatically categorized`;
    }

    if (classificationArray.length === 1) {
      return `${classifiedDocs.length} files automatically categorized as ${classificationArray[0]}`;
    }

    if (classificationArray.length === 2) {
      return `${classifiedDocs.length} files automatically categorized as ${classificationArray[0]} and ${classificationArray[1]}`;
    }

    // For more than 2 classifications, show first two with "and others"
    return `${classifiedDocs.length} files automatically categorized as ${classificationArray[0]}, ${classificationArray[1]} and others`;
  };

  const _getRecentFileName = () => {
    if (documents.length === 0) return null;

    const recentDoc = documents[0];
    const fileName = recentDoc?.name || recentDoc?.title;

    if (!fileName) return null;

    // Truncate long file names
    if (fileName.length > 25) {
      return `${fileName.substring(0, 22)}...`;
    }

    return fileName;
  };

  return (
    <BaseWidget
      title="File Management"
      icon={<Icons.Vault className="size-4" />}
      description={getActivityMessage()}
      onClick={handleOpenVault}
      actions="View files"
    />
  );
}
