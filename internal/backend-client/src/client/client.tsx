import {
  AccountingServiceApi,
  Configuration,
  FinancialServiceApi,
  SocialServiceApi,
  UserServiceV2Api,
  WorkspaceServiceApi,
  WorkspaceServiceRestApi,
  type Middleware,
} from "client-typescript-sdk";

import {
  addCustomHeaderMiddleware,
  errorHandlingMiddleware,
} from "./middleware";

/**
 * Returns a Configuration object with the specified API URL, token, and
 * middlewares.
 *
 * @param {string} apiUrl - The base URL of the API.
 * @param {string} [token] - An optional token for authorization.
 * @param {Middleware[]} [middlewares=[]] - An optional array of middlewares to
 *   be applied. Default is `[]`
 * @returns {Configuration} The Configuration object with the specified
 *   settings.
 */
export function getConfiguration(
  apiUrl: string,
  token?: string,
  middlewares: Middleware[] = [],
): Configuration {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Only set the Authorization header if a token is provided
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = new Configuration({
    basePath: apiUrl,
    accessToken: token ?? "", // Add type assertion here
    headers: headers,
    middleware: middlewares,
  });

  return config;
}

/*
 * Singleton HttpClient class to manage the BackendClient instance.
 *
 * @class BackendClient
 * */
export class BackendClient {
  private token: string;
  private apiUrl: string;
  public configuration: Configuration;
  public userServiceApi: UserServiceV2Api;
  public accountingServiceApi: AccountingServiceApi;
  public financialServiceApi: FinancialServiceApi;
  public socialServiceApi: SocialServiceApi;
  public workspaceServiceApi: WorkspaceServiceApi;
  public workspaceServiceRestApi: WorkspaceServiceRestApi;
  private static middleware: Middleware[] = [
    addCustomHeaderMiddleware,
    errorHandlingMiddleware,
  ];

  constructor(apiUrl: string, token: string) {
    this.token = token;
    this.apiUrl = apiUrl;
    this.configuration = getConfiguration(
      this.apiUrl,
      token,
      BackendClient.middleware,
    );
    this.userServiceApi = new UserServiceV2Api(this.configuration);
    this.accountingServiceApi = new AccountingServiceApi(this.configuration);
    this.financialServiceApi = new FinancialServiceApi(this.configuration);
    this.socialServiceApi = new SocialServiceApi(this.configuration);
    this.workspaceServiceApi = new WorkspaceServiceApi(this.configuration);
    this.workspaceServiceRestApi = new WorkspaceServiceRestApi(
      this.configuration,
    );
  }

  public setToken(token: string, apiUrl: string) {
    this.token = token;
    this.apiUrl = apiUrl;
    this.configuration = getConfiguration(
      this.apiUrl,
      token,
      BackendClient.middleware,
    );
  }

  public getAccountingServiceApi() {
    return this.accountingServiceApi;
  }

  public getFinancialServiceApi() {
    return this.financialServiceApi;
  }

  public getSocialServiceApi() {
    return this.socialServiceApi;
  }

  public getUserServiceV2Api() {
    return this.userServiceApi;
  }

  public getWorkspaceServiceApi() {
    return this.workspaceServiceApi;
  }

  public getToken = () => {
    return this.token;
  };
}

/**
 * Singleton HttpClient class to manage the BackendClient instance.
 *
 * @class SingletonHttpClient
 * @export
 */
export class SingletonHttpClient {
  private static instance: BackendClient | null = null;

  // Method to initialize the singleton instance with a token
  public static initialize(token: string, apiUrl: string): void {
    // if (!token) {
    //   console.error("Token is invalid or empty. Cannot initialize BackendClient.");
    //   return;
    // }

    if (this.instance) {
      this.instance.setToken(token, apiUrl);
    } else {
      this.instance = new BackendClient(apiUrl, token);
    }
  }

  public static setToken(token: string, apiUrl: string): void {
    if (!this.instance) {
      this.instance = new BackendClient(apiUrl, token);
    } else {
      this.instance.setToken(token, apiUrl);
    }
  }

  public static getToken = () => {
    if (!this.instance) {
      throw new Error(
        "SingletonHttpClient is not initialized. Call initialize(token) first.",
      );
    }

    return this.instance.getToken();
  };

  // Static method to get the singleton instance
  public static getInstance(): BackendClient {
    if (!this.instance) {
      throw new Error(
        "SingletonHttpClient is not initialized. Call initialize(token) first.",
      );
    }
    return this.instance;
  }

  public static getInitOverrides(): RequestInit {
    if (!this.instance) {
      console.error("SingletonHttpClient is not initialized.");
      throw new Error("SingletonHttpClient is not initialized.");
    } else {
      const token = this.instance.getToken();
      if (!token) {
        throw new Error("No token available");
      }

      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }
}
