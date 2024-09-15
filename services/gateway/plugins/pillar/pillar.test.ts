import testCreds from "./.creds.json";
import { handler as scanPromptHandler } from "./scanPrompt";
import { handler as scanResponseHandler } from "./scanResponse";

function getParameters(
  scanners: string[] = [
    "pii",
    "prompt_injection",
    "secrets",
    "toxic_language",
    "invisible_characters",
  ],
) {
  return {
    credentials: testCreds,
    scanners,
  };
}

describe("scanPrompt handler", () => {
  it("should fail if the apiKey is invalid", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = JSON.parse(JSON.stringify(getParameters()));
    parameters.credentials.apiKey = "invalid-api-key";

    const result = await scanPromptHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it("should pass when text is clean", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = getParameters();

    const result = await scanPromptHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it("should fail when text contains PII", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "My social security number is 112-42-3323" },
    };
    const parameters = getParameters();

    const result = await scanPromptHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

describe("scanResponse handler", () => {
  it("should pass when response is clean", async () => {
    const eventType = "afterRequestHook";
    const context = {
      response: { text: "this is a test string for moderations" },
    };
    const parameters = getParameters(["pii"]);

    const result = await scanResponseHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it("should fail when response contains PII", async () => {
    const eventType = "afterRequestHook";
    const context = {
      response: { text: "My social security number is 112-42-3323" },
    };
    const parameters = getParameters(["pii"]);

    const result = await scanResponseHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});
