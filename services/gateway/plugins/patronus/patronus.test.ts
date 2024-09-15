import testCreds from "./.creds.json";
import { handler as phiHandler } from "./phi";
import { handler as piiHandler } from "./pii";
import { handler as toxicityHandler } from "./toxicity";
import { handler as retrievalAnswerRelevanceHandler } from "./retrievalAnswerRelevance";
import { handler as customHandler } from "./custom";

describe("phi handler", () => {
  it("should fail if beforeRequestHook is used", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = { credentials: testCreds };

    const result = await phiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it("should pass when text is clean", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
      response: { text: "this is a test string for moderations" },
    };

    const parameters = { credentials: testCreds };

    const result = await phiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it("should fail when text contains PHI", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: {
        text: `Your hospital's patient - John Doe. What is he in for?`,
      },
      response: {
        text: "John Doe is in the hospital for a bad case of carpal tunnel.",
      },
    };

    const parameters = { credentials: testCreds };

    const result = await phiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

describe("pii handler", () => {
  it("should fail if beforeRequestHook is used", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = { credentials: testCreds };

    const result = await piiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it("should pass when text is clean", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
      response: { text: "this is a test string for moderations" },
    };

    const parameters = { credentials: testCreds };

    const result = await piiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it("should fail when text contains PII", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: {
        text: `Your hospital's patient - John Doe. What is he in for?`,
      },
      response: {
        text: `Sure! Happy to provide the SSN of John Doe - it's 123-45-6789.`,
      },
    };

    const parameters = { credentials: testCreds };

    const result = await piiHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

describe("toxicity handler", () => {
  it("should fail if beforeRequestHook is used", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = { credentials: testCreds };

    const result = await toxicityHandler(context, parameters, eventType);
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it("should pass when text is clean", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
      response: { text: "this is a test string for moderations" },
    };

    const parameters = { credentials: testCreds };

    const result = await toxicityHandler(context, parameters, eventType);
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });

  it("should fail when text is toxic", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: `You stinking, lazy ` },
      response: { text: `piece of shit! Who do you think you are?` },
    };

    const parameters = { credentials: testCreds };

    const result = await toxicityHandler(context, parameters, eventType);
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  });
});

describe("retrieval answer relevance handler", () => {
  it("should fail if beforeRequestHook is used", async () => {
    const eventType = "beforeRequestHook";
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const parameters = { credentials: testCreds };

    const result = await retrievalAnswerRelevanceHandler(
      context,
      parameters,
      eventType,
    );
    // console.log(result);
    expect(result).toBeDefined();
    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });

  it("should pass when answer is relevant to the question", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: "What is one of the biggest benefits of Gen AI?" },
      response: {
        text: `Gen AI will free up humanity's time so that we humans can focus on more purposeful ideals.`,
      },
    };

    const parameters = { credentials: testCreds };

    const result = await retrievalAnswerRelevanceHandler(
      context,
      parameters,
      eventType,
    );
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  }, 10000);

  it("should fail when answer is irrelevant", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: `What is one of the biggest benefits of Gen AI?` },
      response: { text: `Betty bought a bit of butter` },
    };

    const parameters = { credentials: testCreds };

    const result = await retrievalAnswerRelevanceHandler(
      context,
      parameters,
      eventType,
    );
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  }, 10000);
});

describe("custom handler (is-concise)", () => {
  it("should pass when answer is concise", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: "Tell me a bit more about Company A." },
      response: {
        text: `Company A builds the leading platform for database management software, called A-DB.`,
      },
    };

    const parameters = { credentials: testCreds, profile: "system:is-concise" };

    const result = await customHandler(context, parameters, eventType);
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(true);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  }, 10000);

  it("should fail when answer is lengthy", async () => {
    const eventType = "afterRequestHook";
    const context = {
      request: { text: `What is one of the biggest benefits of Gen AI?` },
      response: {
        text: `Company A builds the leading platform for database management software, called A-DB. Company A has won many awards for their innovative work here, including the '2023 Innovative Company of the year' award for their groundbreaking features. Sign up to get access to A-DB, and accelerate your engineering teams today!`,
      },
    };

    const parameters = { credentials: testCreds, profile: "system:is-concise" };

    const result = await customHandler(context, parameters, eventType);
    console.log(result);
    expect(result).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
  }, 10000);
});
