import { post } from "../utils";

export const BASE_URL = "https://api.patronus.ai/v1/evaluate";

export const postPatronus = async (
  evaluator: string,
  credentials: any,
  data: any,
  profile: string | null = null,
) => {
  const options = {
    headers: {
      "x-api-key": `${credentials.apiKey}`,
    },
  };

  const body = {
    evaluators: [
      {
        evaluator: evaluator,
        explain_strategy: "always",
        ...(profile && { profile_name: profile }),
      },
    ],
    evaluated_model_input: data.input,
    evaluated_model_output: data.output,
    // "evaluated_model_retrieved_context": ["I am John."]
  };

  const timeout = data.timeout || 5000;

  return post(BASE_URL, body, options, timeout);
};
