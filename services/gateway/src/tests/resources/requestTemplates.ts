import { Params } from '../../types/requestBody';

const CHAT_COMPLETE_WITH_MESSAGE_CONTENT_ARRAYS_REQUEST: Params = {
  model: 'MODEL_PLACE_HOLDER',
  max_tokens: 20,
  stream: false,
  messages: [
    {
      role: 'system',
      content: 'You are the half-blood prince',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Can you teach me a useful spell?',
        },
      ],
    },
  ],
};

export const getChatCompleteWithMessageContentArraysRequest = (
  model?: string
) => {
  return JSON.stringify({
    ...CHAT_COMPLETE_WITH_MESSAGE_CONTENT_ARRAYS_REQUEST,
    model,
  });
};

export const CHAT_COMPLETE_WITH_MESSAGE_STRING_REQUEST: Params = {
  model: 'MODEL_PLACEHOLDER',
  max_tokens: 20,
  stream: false,
  messages: [
    {
      role: 'system',
      content: 'You are the half-blood prince',
    },
    {
      role: 'user',
      content: 'Can you teach me a useful spell?',
    },
  ],
};

export const getChatCompleteWithMessageStringRequest = (model?: string) => {
  return JSON.stringify({
    ...CHAT_COMPLETE_WITH_MESSAGE_STRING_REQUEST,
    model,
  });
};
