import { handler as moderateContentHandler } from "./moderateContent";
import { handler as piiHandler } from "./pii";
import { handler as languageHandler } from "./language";
import { handler as gibberishHandler } from "./gibberish";
import testCreds from "./.creds.json";

describe.skip("moderateContentHandler", () => {
  it("should return an error if hook type is not supported", async () => {
    const context = {};
    const eventType = "unsupported";
    const parameters = {};
    // @ts-ignore
    const result = await moderateContentHandler(context, parameters, eventType);
    expect(result.error).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeNull();
  });

  it("should return an error if fetch request fails", async () => {
    const context = {};
    const eventType = "beforeRequestHook";
    const parameters = { PORTKEY_API_KEY: "test" };
    const result = await moderateContentHandler(context, parameters, eventType);
    expect(result.error).toBeDefined();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeNull();
  });

  it("should return verdict and data if fetch request succeeds", async () => {
    const context = {
      request: { text: "this is a test string for moderations" },
    };
    const eventType = "beforeRequestHook";
    const parameters = {
      credentials: testCreds,
      categories: ["violence"],
    };
    const result = await moderateContentHandler(context, parameters, eventType);
    expect(result.error).toBeNull();
    expect(result.verdict).toBeDefined();
    expect(result.data).toBeDefined();
  });

  it("should return verdict as false if text is flagged", async () => {
    const context = {
      request: { text: "I really want to murder him brutally." },
    };
    const eventType = "beforeRequestHook";
    const parameters = {
      credentials: testCreds,
      categories: ["violence"],
    };
    const result = await moderateContentHandler(context, parameters, eventType);
    expect(result.error).toBeNull();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeDefined();
  });
});

describe("piiHandler", () => {
  it("should fail when the request text contains PII", async () => {
    const context = {
      request: {
        text: "My credit card number is 0123 0123 0123 0123, and I live in Wilmington, Delaware",
      },
    };
    const eventType = "beforeRequestHook";
    const parameters = {
      categories: [
        "EMAIL_ADDRESS",
        "PHONE_NUMBER",
        "LOCATION_ADDRESS",
        "NAME",
        "IP_ADDRESS",
        "CREDIT_CARD",
        "SSN",
      ],
      credentials: testCreds,
    };

    const result = await piiHandler(context, parameters, eventType);

    expect(result.error).toBeNull();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeDefined();
  });
});

describe("languageHandler", () => {
  it("should return positive verdict if the language of the text matches the input", async () => {
    const context = {
      request: { text: "hola mundo" },
      response: { text: "hola mundo" },
    };
    const eventType = "afterRequestHook";
    const parameters = {
      language: ["spa_Latn", "por_Latn"],
      credentials: testCreds,
    };

    const result = await languageHandler(context, parameters, eventType);

    expect(result.error).toBeNull();
    expect(result.verdict).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should return false verdict if the language of the text does not match the input", async () => {
    const context = {
      request: { text: "hola mundo" },
      response: { text: "hola mundo" },
    };
    const eventType = "afterRequestHook";
    const parameters = {
      language: ["jpn_Jpan"],
      credentials: testCreds,
    };

    const result = await languageHandler(context, parameters, eventType);

    expect(result.error).toBeNull();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeDefined();
  });
});

describe("gibberishHandler", () => {
  it("should return positive verdict if the text is not gibberish", async () => {
    const context = {
      request: { text: "this is a test string" },
      response: { text: "this is a test string" },
    };
    const eventType = "afterRequestHook";
    const parameters = { credentials: testCreds };

    const result = await gibberishHandler(context, parameters, eventType);

    expect(result.error).toBeNull();
    expect(result.verdict).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should return false verdict if the text is gibberish", async () => {
    const context = {
      request: { text: "asdlkf shjdfkksdf skjdhfkjhsf028934oijfdlskj" },
    };

    const eventType = "beforeRequestHook";
    const parameters = { credentials: testCreds };

    const result = await gibberishHandler(context, parameters, eventType);
    expect(result.error).toBeNull();
    expect(result.verdict).toBe(false);
    expect(result.data).toBeDefined();
  });
});
