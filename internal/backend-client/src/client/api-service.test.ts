import {
  AccountingServiceApi,
  Configuration,
  FinancialServiceApi,
  Middleware,
  SocialServiceApi,
  UserServiceV2Api,
  WorkspaceServiceApi,
  WorkspaceServiceRestApi,
} from "client-typescript-sdk";

import { ApiService } from "./api-service";
import { ApiConfig } from "./config";
import { Logger } from "./logger";

// Mock the dependencies
jest.mock("client-typescript-sdk");
jest.mock("./logger");

describe("ApiService", () => {
  const mockConfig: ApiConfig = {
    apiUrl: "https://api.example.com",
    token: "test-token",
  };
  const mockMiddlewares: Middleware[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("constructor initializes properly", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    expect(apiService).toBeDefined();
    expect(Logger.info).toHaveBeenCalledWith("ApiService instance created", {
      apiUrl: mockConfig.apiUrl,
    });
  });

  test("setToken updates token and recreates configuration", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const newToken = "new-token";
    apiService.setToken(newToken);
    expect(apiService.getToken()).toBe(newToken);
    expect(Logger.info).toHaveBeenCalledWith(
      "New token set and configuration updated",
    );
  });

  test("getToken returns the correct token", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    expect(apiService.getToken()).toBe(mockConfig.token);
  });

  test("getUserServiceV2Api returns a new UserServiceV2Api instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const userService = apiService.getUserServiceV2Api();
    expect(userService).toBeInstanceOf(UserServiceV2Api);
  });

  test("getAccountingServiceApi returns a new AccountingServiceApi instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const accountingService = apiService.getAccountingServiceApi();
    expect(accountingService).toBeInstanceOf(AccountingServiceApi);
  });

  test("getFinancialServiceApi returns a new FinancialServiceApi instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const financialService = apiService.getFinancialServiceApi();
    expect(financialService).toBeInstanceOf(FinancialServiceApi);
  });

  test("getSocialServiceApi returns a new SocialServiceApi instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const socialService = apiService.getSocialServiceApi();
    expect(socialService).toBeInstanceOf(SocialServiceApi);
  });

  test("getWorkspaceServiceApi returns a new WorkspaceServiceApi instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const workspaceService = apiService.getWorkspaceServiceApi();
    expect(workspaceService).toBeInstanceOf(WorkspaceServiceApi);
  });

  test("getWorkspaceServiceRestApi returns a new WorkspaceServiceRestApi instance", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const workspaceRestService = apiService.getWorkspaceServiceRestApi();
    expect(workspaceRestService).toBeInstanceOf(WorkspaceServiceRestApi);
  });

  test("updateMiddlewares updates middlewares and recreates configuration", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const newMiddlewares: Middleware[] = [];
    apiService.updateMiddlewares(newMiddlewares);
    expect(Logger.info).toHaveBeenCalledWith(
      "Middlewares updated and configuration recreated",
    );
  });

  test("getConfig returns the current API configuration", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    expect(apiService.getConfig()).toEqual(mockConfig);
  });

  test("createConfiguration creates correct Configuration object", () => {
    const apiService = new ApiService(mockConfig, mockMiddlewares);
    const configuration = (apiService as any).createConfiguration();
    expect(configuration).toBeInstanceOf(Configuration);
    expect(Configuration).toHaveBeenCalledWith({
      basePath: mockConfig.apiUrl,
      accessToken: mockConfig.token,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mockConfig.token}`,
      },
      middleware: mockMiddlewares,
    });
  });
});
