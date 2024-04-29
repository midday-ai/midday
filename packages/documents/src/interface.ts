import type { GetDocumentRequest, GetDocumentResponse } from "./types";

export interface Processor {
  getDocument: (params: GetDocumentRequest) => Promise<GetDocumentResponse>;
}
