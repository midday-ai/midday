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

import { ApiConfig } from "./config";
import { Logger } from "./logger";
import { IApiService } from "./types";

/**
 * ApiService class that implements IApiService interface.
 * This class manages API configurations and provides access to various service APIs.
 */
export class ApiService implements IApiService {
  private configuration: Configuration;
  private token?: string;

  /**
   * Creates an instance of ApiService.
   * @param {ApiConfig} config - The API configuration.
   * @param {Middleware[]} middlewares - An array of middlewares to be applied.
   */
  constructor(
    private config: ApiConfig,
    private middlewares: Middleware[],
  ) {
    this.token = config.token;
    this.configuration = this.createConfiguration();
    Logger.info("ApiService instance created", { apiUrl: this.config.apiUrl });
  }

  /**
   * Creates a Configuration object based on the current settings.
   * @private
   * @returns {Configuration} The created Configuration object.
   */
  private createConfiguration(): Configuration {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return new Configuration({
      basePath: this.config.apiUrl,
      accessToken: this.token,
      headers: headers,
      middleware: this.middlewares,
    });
  }

  /**
   * Sets a new token and recreates the configuration.
   * @param {string} token - The new token to be set.
   */
  public setToken(token: string): void {
    this.token = token;
    this.configuration = this.createConfiguration();
    Logger.info("New token set and configuration updated");
  }

  /**
   * Gets the current token.
   * @returns {string | undefined} The current token or undefined if not set.
   */
  public getToken(): string | undefined {
    return this.token;
  }

  /**
   * Gets an instance of UserServiceV2Api.
   * @returns {UserServiceV2Api} An instance of UserServiceV2Api.
   */
  public getUserServiceV2Api(): UserServiceV2Api {
    return new UserServiceV2Api(this.configuration);
  }

  /**
   * Gets an instance of AccountingServiceApi.
   * @returns {AccountingServiceApi} An instance of AccountingServiceApi.
   */
  public getAccountingServiceApi(): AccountingServiceApi {
    return new AccountingServiceApi(this.configuration);
  }

  /**
   * Gets an instance of FinancialServiceApi.
   * @returns {FinancialServiceApi} An instance of FinancialServiceApi.
   */
  public getFinancialServiceApi(): FinancialServiceApi {
    return new FinancialServiceApi(this.configuration);
  }

  /**
   * Gets an instance of SocialServiceApi.
   * @returns {SocialServiceApi} An instance of SocialServiceApi.
   */
  public getSocialServiceApi(): SocialServiceApi {
    return new SocialServiceApi(this.configuration);
  }

  /**
   * Gets an instance of WorkspaceServiceApi.
   * @returns {WorkspaceServiceApi} An instance of WorkspaceServiceApi.
   */
  public getWorkspaceServiceApi(): WorkspaceServiceApi {
    return new WorkspaceServiceApi(this.configuration);
  }

  /**
   * Gets an instance of WorkspaceServiceRestApi.
   * @returns {WorkspaceServiceRestApi} An instance of WorkspaceServiceRestApi.
   */
  public getWorkspaceServiceRestApi(): WorkspaceServiceRestApi {
    return new WorkspaceServiceRestApi(this.configuration);
  }

  /**
   * Updates the middlewares and recreates the configuration.
   * @param {Middleware[]} middlewares - The new array of middlewares.
   */
  public updateMiddlewares(middlewares: Middleware[]): void {
    this.middlewares = middlewares;
    this.configuration = this.createConfiguration();
    Logger.info("Middlewares updated and configuration recreated");
  }

  /**
   * Gets the current API configuration.
   * @returns {ApiConfig} The current API configuration.
   */
  public getConfig(): ApiConfig {
    return this.config;
  }
}
