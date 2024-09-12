import { HUGGING_FACE } from '../../globals';
import { ErrorResponse } from '../types';
import { generateErrorResponse } from '../utils';
import { HuggingfaceErrorResponse } from './types';

export const HuggingfaceErrorResponseTransform: (
  response: HuggingfaceErrorResponse,
  responseStatus: number
) => ErrorResponse = (response, responseStatus) => {
  return generateErrorResponse(
    {
      message: response.error,
      type: null,
      param: null,
      code: responseStatus.toString(),
    },
    HUGGING_FACE
  );
};
