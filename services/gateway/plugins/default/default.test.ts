import { handler as jsonSchemaHandler } from "./jsonSchema";
import { handler as jsonKeysHandler } from "./jsonKeys";
import { handler as containsHandler } from "./contains";
import { handler as validUrlsHandler } from "./validUrls";
import { handler as containsCodeHandler } from "./containsCode";
import { handler as wordCountHandler } from "./wordCount";
import { handler as sentenceCountHandler } from "./sentenceCount";
import { handler as webhookHandler } from "./webhook";
import { handler as logHandler } from "./log";

import { z } from "zod";
import { PluginContext, PluginParameters } from "../types";

describe("jsonSchema handler", () => {
  it("should validate JSON in response text", async () => {
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const eventType = "afterRequestHook";
    const parameters: PluginParameters = {
      schema: z.object({ key: z.string() }),
    };

    const result = await jsonSchemaHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
    expect(result.data).toEqual({ key: "value" });
  });

  it("should return a false verdict for invalid JSON in response text", async () => {
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value`,
      },
    };
    const eventType = "afterRequestHook";
    const parameters: PluginParameters = {
      schema: z.object({ key: z.string() }),
    };

    const result = await jsonSchemaHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
    expect(result.data).toBe(null);
  });
});

describe("jsonKeys handler", () => {
  it("should return true verdict for any key in JSON", async () => {
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      keys: ["key1"],
      operator: "any",
    };

    const result = await jsonKeysHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
    expect(result.data).toEqual({ key1: "value" });
  });

  it("should return false verdict for all keys in JSON", async () => {
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      keys: ["key1", "key2"],
      operator: "all",
    };

    const result = await jsonKeysHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);

    // console.log(result);
  });

  it("should return true verdict for none of the keys in JSON", async () => {
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      keys: ["key2"],
      operator: "none",
    };

    const result = await jsonKeysHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
    expect(result.data).toEqual({ key1: "value" });

    // console.log(result);
  });
});

describe("contains handler", () => {
  it("should return true verdict for any word in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this word1 and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      words: ["word1"],
      operator: "any",
    };

    const result = await containsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for all words in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this word1 and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      words: ["word1", "word2"],
      operator: "all",
    };

    const result = await containsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return true verdict for none of the words in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this word1 and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      words: ["word2"],
      operator: "none",
    };

    const result = await containsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });
});

describe("validUrls handler", () => {
  it("should return true verdict for valid URLs in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this https://example.com and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      onlyDNS: false,
    };

    const result = await validUrlsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for invalid URLs in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this https://invalidurl.cm and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      onlyDNS: false,
    };

    const result = await validUrlsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return true verdict for URLs with valid DNS in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this https://portkey.ai and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      onlyDNS: true,
    };

    const result = await validUrlsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for URLs with invalid DNS in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this https://invalidurl.com and adding some text after",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      onlyDNS: true,
    };

    const result = await validUrlsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return true verdict for URLs with valid DNS and invalid URL in response text", async () => {
    const context: PluginContext = {
      response: {
        text: "adding some text before this https://example.com and adding some text after https://invalidurl.com",
      },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      onlyDNS: true,
    };

    const result = await validUrlsHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });
});

describe("sentenceCount handler", () => {
  it("should return true verdict for sentence count within range in response text", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence. This is another sentence." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      minSentences: 0,
      maxSentences: 2,
    };

    const result = await sentenceCountHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for sentence count outside range in response text", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence. This is another sentence." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      minSentences: 3,
      maxSentences: 3,
    };

    const result = await sentenceCountHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return error for missing sentence count range in parameters", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence. This is another sentence." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {};

    const result = await sentenceCountHandler(context, parameters, eventType);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Missing sentence count range or text");
    expect(result.verdict).toBe(false);
    expect(result.data).toBe(null);
  });
});

describe("containsCode handler", () => {
  it("should return true verdict for format in code block in response text", async () => {
    const context: PluginContext = {
      response: { text: '```js\nconsole.log("Hello, World!");\n```' },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      format: "JavaScript",
    };

    const result = await containsCodeHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for format not in code block in response text", async () => {
    const context: PluginContext = {
      response: { text: '```py\nprint("Hello, World!")\n```' },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      format: "JavaScript",
    };

    const result = await containsCodeHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return data for no code block in response text", async () => {
    const context: PluginContext = {
      response: { text: "No code block found in the response text." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      format: "JavaScript",
    };

    const result = await containsCodeHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
    expect(result.data).toEqual({
      message: "No code block found in the response text.",
    });
  });
});

describe("wordCount handler", () => {
  it("should return true verdict for word count within range in response text", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence with 6 words." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      minWords: 6,
      maxWords: 8,
    };

    const result = await wordCountHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });

  it("should return false verdict for word count outside range in response text", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence with 6 words." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {
      minWords: 1,
      maxWords: 3,
    };

    const result = await wordCountHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
  });

  it("should return error for missing word count range in parameters", async () => {
    const context: PluginContext = {
      response: { text: "This is a sentence with 6 words." },
    };
    const eventType = "afterRequestHook";

    const parameters: PluginParameters = {};

    const result = await wordCountHandler(context, parameters, eventType);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("Missing word count range or text");
    expect(result.verdict).toBe(false);
    expect(result.data).toBe(null);
  });
});

describe("webhook handler", () => {
  it("should handle a postive result from a webhook", async () => {
    const eventType = "afterRequestHook";
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const parameters: PluginParameters = {
      webhookURL: "https://roh26it-blackplanarian.web.val.run/true",
    };

    const result = await webhookHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
    expect(result.data).toEqual(context);
  });

  it("should handle a negative result from a webhook", async () => {
    const eventType = "afterRequestHook";
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };
    const parameters: PluginParameters = {
      webhookURL: "https://roh26it-blackplanarian.web.val.run/false",
    };

    const result = await webhookHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(false);
    expect(result.data).toEqual(context);
  });

  it("should handle an error from a webhook", async () => {
    const eventType = "afterRequestHook";
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };

    const parameters: PluginParameters = {
      webhookURL: "https://roh26it-blackplanarian.web.val.run/error",
    };

    const result = await webhookHandler(context, parameters, eventType);

    expect(result.error).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.data).toBe(null);
  });

  it("should handle a timeout from a webhook", async () => {
    const eventType = "afterRequestHook";
    const context: PluginContext = {
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
      },
    };

    const parameters: PluginParameters = {
      webhookURL: "https://roh26it-blackplanarian.web.val.run/timeout",
    };

    const result = await webhookHandler(context, parameters, eventType);

    expect(result.error).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.data).toBe(null);
  });
});

describe("log handler", () => {
  it("should log details to a URL", async () => {
    const eventType = "afterRequestHook";
    const context: PluginContext = {
      request: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
        json: { key: "value" },
      },
      response: {
        text: `adding some text before this \`\`\`json\n{"key1": "value"}\n\`\`\`\n and adding some text after {"key":"value"}`,
        json: { key: "value" },
      },
    };
    const parameters: PluginParameters = {
      logURL: "https://roh26it-upsetharlequinfrog.web.val.run",
      headers: '{"Authorization": "this is some secret"}',
    };

    const result = await logHandler(context, parameters, eventType);

    expect(result.error).toBe(null);
    expect(result.verdict).toBe(true);
  });
});
