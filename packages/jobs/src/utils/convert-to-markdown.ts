import { client } from "@midday/engine-client";
import { logger } from "@trigger.dev/sdk";

export async function convertToMarkdown(
  fileData: Blob,
  fileName: string,
): Promise<string | null> {
  try {
    const formData = new FormData();

    // Create a File object from the Blob with the proper filename
    const file = new File([fileData], fileName, { type: fileData.type });
    formData.append("files", file);

    const response = await client.documents["markdown"].$post({
      form: formData,
    });

    if (!response.ok) {
      logger.error("Failed to convert document to markdown", {
        status: response.status,
        statusText: response.statusText,
      });
      return null;
    }

    const result = await response.json();

    if ("data" in result && result.data && result.data.length > 0) {
      return result.data[0].data;
    }

    logger.warn("No markdown data returned from conversion");
    return null;
  } catch (error) {
    logger.error("Error converting document to markdown", { error });
    return null;
  }
}
