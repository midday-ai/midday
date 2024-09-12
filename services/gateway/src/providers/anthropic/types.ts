export type AnthropicStreamState = {
  containsChainOfThoughtMessage?: boolean;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
};
