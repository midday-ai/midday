import type { DocumentClientParams } from "./types";

export class DocumentClient {
  #provider;

  constructor({ mimeType }: DocumentClientParams) {
    switch (mimeType) {
      case "application/pdf":
        this.#provider = null;
        break;
      case "image/jpeg":
        this.#provider = null;
        break;
      default:
        throw Error("Mime type not supported");
    }
  }

  public async processDocument({ content }) {
    this.#provider.processDocument({ content });
  }
}
