import {
  AccountingServiceApi,
  Configuration,
  FinancialServiceApi,
  SocialServiceApi,
  UserServiceV2Api,
  WorkspaceServiceApi,
  WorkspaceServiceRestApi,
} from "client-typescript-sdk";

import { BackendClient, getConfiguration, SingletonHttpClient } from "./client";

// Mock the client-typescript-sdk
jest.mock("client-typescript-sdk", () => {
  const actualModule = jest.requireActual("client-typescript-sdk");
  return {
    ...actualModule,
    Configuration: jest
      .fn()
      .mockImplementation(({ basePath, accessToken, headers, middleware }) => ({
        basePath,
        accessToken,
        headers,
        middleware,
        isJsonMime: actualModule.Configuration.prototype.isJsonMime,
      })),
  };
});

describe("BackendClient", () => {
  const apiUrl = "https://api.example.com";
  const token = "test-token";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("constructor initializes properly", () => {
    const client = new BackendClient(apiUrl, token);
    expect(client.configuration).toBeDefined();
    expect(client.userServiceApi).toBeInstanceOf(UserServiceV2Api);
    expect(client.accountingServiceApi).toBeInstanceOf(AccountingServiceApi);
    expect(client.financialServiceApi).toBeInstanceOf(FinancialServiceApi);
    expect(client.socialServiceApi).toBeInstanceOf(SocialServiceApi);
    expect(client.workspaceServiceApi).toBeInstanceOf(WorkspaceServiceApi);
    expect(client.workspaceServiceRestApi).toBeInstanceOf(
      WorkspaceServiceRestApi,
    );
  });

  test("setToken updates configuration", () => {
    const client = new BackendClient(apiUrl, token);
    const newToken = "new-token";
    client.setToken(newToken, apiUrl);
    expect(client.configuration.accessToken).toBe(newToken);
    expect(Configuration).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: apiUrl,
        accessToken: newToken,
      }),
    );
  });

  test("getToken returns the correct token", () => {
    const client = new BackendClient(apiUrl, token);
    expect(client.getToken()).toBe(token);
  });
});

describe("SingletonHttpClient", () => {
  const apiUrl = "https://api.example.com";
  const token = "test-token";

  beforeEach(() => {
    jest.clearAllMocks();
    SingletonHttpClient["instance"] = null; // Reset the singleton
  });

  test("initialize creates a new instance", () => {
    SingletonHttpClient.initialize(token, apiUrl);
    expect(SingletonHttpClient["instance"]).toBeInstanceOf(BackendClient);
  });

  test("initialize updates token if instance exists", () => {
    SingletonHttpClient.initialize(token, apiUrl);
    const newToken = "new-token";
    SingletonHttpClient.initialize(newToken, apiUrl);
    expect(SingletonHttpClient.getToken()).toBe(newToken);
  });

  test("setToken creates new instance if not initialized", () => {
    SingletonHttpClient.setToken(token, apiUrl);
    expect(SingletonHttpClient["instance"]).toBeInstanceOf(BackendClient);
  });

  test("getToken throws error if not initialized", () => {
    expect(() => SingletonHttpClient.getToken()).toThrow(
      "SingletonHttpClient is not initialized",
    );
  });

  test("getInstance throws error if not initialized", () => {
    expect(() => SingletonHttpClient.getInstance()).toThrow(
      "SingletonHttpClient is not initialized",
    );
  });

  test("getInitOverrides returns correct headers", () => {
    SingletonHttpClient.initialize(token, apiUrl);
    const overrides = SingletonHttpClient.getInitOverrides();
    expect(overrides.headers).toEqual({ Authorization: `Bearer ${token}` });
  });

  test("getInitOverrides throws error if not initialized", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    expect(() => SingletonHttpClient.getInitOverrides()).toThrow(
      "SingletonHttpClient is not initialized",
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "SingletonHttpClient is not initialized.",
    );
    consoleErrorSpy.mockRestore();
  });
});

describe("getConfiguration", () => {
  test("returns correct configuration object", () => {
    const apiUrl = "https://api.example.com";
    const token = "test-token";
    const config = getConfiguration(apiUrl, token);

    expect(Configuration).toHaveBeenCalledWith({
      basePath: apiUrl,
      accessToken: token,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      middleware: expect.any(Array),
    });

    expect(config.basePath).toBe(apiUrl);
    expect(config.accessToken).toBe(token);
    expect(config.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
  });

  test("handles missing token correctly", () => {
    const apiUrl = "https://api.example.com";
    const config = getConfiguration(apiUrl);

    expect(Configuration).toHaveBeenCalledWith({
      basePath: apiUrl,
      accessToken: "",
      headers: { "Content-Type": "application/json" },
      middleware: expect.any(Array),
    });

    expect(config.basePath).toBe(apiUrl);
    expect(config.accessToken).toBe("");
    expect(config.headers).toEqual({ "Content-Type": "application/json" });
  });
});
