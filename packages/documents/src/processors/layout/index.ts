import {
  type AnalyzeResultOperationOutput,
  getLongRunningPoller,
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";
import { client } from "../../provider/azure";
import type { GetDocumentRequest } from "../../types";

export class LayoutProcessor {
  async #processDocument(content: string) {
    const initialResponse = await client
      .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
      .post({
        contentType: "application/json",
        body: {
          base64Source: content,
        },
      });

    if (isUnexpected(initialResponse)) {
      throw initialResponse.body.error;
    }
    const poller = await getLongRunningPoller(client, initialResponse);
    const result = (await poller.pollUntilDone())
      .body as AnalyzeResultOperationOutput;

    return this.#extractData(result);
  }

  async #extractData(data: AnalyzeResultOperationOutput) {
    const tables = data.analyzeResult?.tables;

    const firstTable = tables?.at(0);
    if (!firstTable?.cells?.length) return null;

    const cellsByRow = firstTable.cells.reduce(
      (acc, cell) => {
        const rowIndex = cell.rowIndex ?? 0;

        if (!acc[rowIndex]) acc[rowIndex] = [];

        acc[rowIndex].push({
          columnIndex: cell.columnIndex ?? 0,
          content: cell.content ?? "",
        });
        return acc;
      },
      {} as Record<number, { columnIndex: number; content: string }[]>,
    );

    return Object.fromEntries(
      Object.entries(cellsByRow)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([rowIndex, cells]) => [
          rowIndex,
          cells.sort((a, b) => a.columnIndex - b.columnIndex),
        ]),
    );
  }

  public async getDocument(params: GetDocumentRequest) {
    return this.#processDocument(params.content);
  }
}
