import { ZHIPU } from "../../globals";
import { EmbedResponse } from "../../types/embedRequestBody";
import { ErrorResponse, ProviderConfig } from "../types";
import { generateErrorResponse } from "../utils";

export const ZhipuEmbedConfig: ProviderConfig = {
  model: {
    param: "model",
    required: true,
    default: "embedding-2",
  },
  input: {
    param: "input",
    required: true,
  },
};

interface ZhipuEmbedResponse extends EmbedResponse {}

export const ZhipuEmbedResponseTransform: (
  response: ZhipuEmbedResponse | ErrorResponse,
  responseStatus: number,
) => EmbedResponse | ErrorResponse = (response, responseStatus) => {
  if (responseStatus !== 200 && "error" in response) {
    return generateErrorResponse(
      {
        message: response.error.message,
        type: response.error.type,
        param: response.error.param,
        code: response.error.code,
      },
      ZHIPU,
    );
  }

  return response;
};
