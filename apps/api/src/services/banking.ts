import { createLoggerWithContext } from "@midday/logger";
import {
  EnableBankingApi,
  GoCardLessApi,
  PlaidApi,
  Provider,
  type Providers,
} from "@midday/banking";
import { TRPCError } from "@trpc/server";

const logger = createLoggerWithContext("banking-service");

/**
 * Shared banking service handlers used by both protected (user-facing)
 * and service (internal) tRPC routers.
 */

export type GetAccountsInput = {
  provider: Providers;
  id?: string;
  accessToken?: string;
  institutionId?: string;
};

export async function getAccounts(input: GetAccountsInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.getAccounts({
      id: input.id,
      accessToken: input.accessToken,
      institutionId: input.institutionId,
    });
  } catch (error) {
    logger.error("Failed to get accounts", { error, provider: input.provider });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get accounts",
    });
  }
}

export type GetAccountBalanceInput = {
  provider: Providers;
  accountId: string;
  accessToken?: string;
  accountType?: string;
};

export async function getAccountBalance(input: GetAccountBalanceInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.getAccountBalance({
      accountId: input.accountId,
      accessToken: input.accessToken,
      accountType: input.accountType,
    });
  } catch (error) {
    logger.error("Failed to get account balance", {
      error,
      provider: input.provider,
      accountId: input.accountId,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get account balance",
    });
  }
}

export type GetConnectionStatusInput = {
  provider: Providers;
  id?: string;
  accessToken?: string;
};

export async function getConnectionStatus(input: GetConnectionStatusInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.getConnectionStatus({
      id: input.id,
      accessToken: input.accessToken,
    });
  } catch (error) {
    logger.error("Failed to get connection status", {
      error,
      provider: input.provider,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get connection status",
    });
  }
}

export type DeleteConnectionInput = {
  provider: Providers;
  id: string;
  accessToken?: string;
};

export async function deleteConnection(input: DeleteConnectionInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.deleteConnection({
      id: input.id,
      accessToken: input.accessToken,
    });
  } catch (error) {
    logger.error("Failed to delete connection", {
      error,
      provider: input.provider,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete connection",
    });
  }
}

export type GetTransactionsInput = {
  provider: Providers;
  accountId: string;
  accessToken?: string;
  latest?: boolean;
  accountType: "depository" | "credit" | "other_asset" | "loan" | "other_liability";
};

export async function getTransactions(input: GetTransactionsInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.getTransactions({
      accountId: input.accountId,
      accessToken: input.accessToken,
      latest: input.latest,
      accountType: input.accountType,
    });
  } catch (error) {
    logger.error("Failed to get transactions", {
      error,
      provider: input.provider,
      accountId: input.accountId,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get transactions",
    });
  }
}

export type DeleteAccountsInput = {
  provider: Providers;
  accountId?: string;
  accessToken?: string;
};

export async function deleteAccounts(input: DeleteAccountsInput) {
  try {
    const provider = new Provider({ provider: input.provider });
    return provider.deleteAccounts({
      accountId: input.accountId,
      accessToken: input.accessToken,
    });
  } catch (error) {
    logger.error("Failed to delete accounts", {
      error,
      provider: input.provider,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete accounts",
    });
  }
}

// GoCardless-specific operations
export async function getConnectionByReference(reference: string) {
  try {
    const api = new GoCardLessApi();
    const requisition = await api.getRequiestionByReference(reference);

    if (!requisition) {
      return null;
    }

    return {
      id: requisition.id,
      status: requisition.status,
      accounts: requisition.accounts,
    };
  } catch (error) {
    logger.error("Failed to get connection by reference", { error, reference });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get connection by reference",
    });
  }
}

// Health check
export async function healthCheck() {
  try {
    const provider = new Provider();
    return provider.getHealthCheck();
  } catch (error) {
    logger.error("Health check failed", { error });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Health check failed",
    });
  }
}

// Provider-specific link/auth operations (not shared, unique to each provider)
export const plaidOperations = {
  async createLink(params: {
    userId: string;
    language?: string;
    accessToken?: string;
    environment?: "sandbox" | "production";
  }) {
    try {
      const api = new PlaidApi();
      const response = await api.linkTokenCreate(params);
      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
      };
    } catch (error) {
      logger.error("Failed to create Plaid link", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create Plaid link token",
      });
    }
  },

  async exchangeToken(publicToken: string) {
    try {
      const api = new PlaidApi();
      const response = await api.itemPublicTokenExchange({ publicToken });
      return {
        access_token: response.data.access_token,
        item_id: response.data.item_id,
      };
    } catch (error) {
      logger.error("Failed to exchange Plaid token", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to exchange Plaid public token",
      });
    }
  },
};

export const goCardlessOperations = {
  async createAgreement(params: {
    institutionId: string;
    transactionTotalDays: number;
  }) {
    try {
      const api = new GoCardLessApi();
      return api.createEndUserAgreement(params);
    } catch (error) {
      logger.error("Failed to create GoCardless agreement", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create GoCardless agreement",
      });
    }
  },

  async createLink(params: {
    institutionId: string;
    agreement: string;
    redirect: string;
    reference?: string;
  }) {
    try {
      const api = new GoCardLessApi();
      return api.buildLink(params);
    } catch (error) {
      logger.error("Failed to create GoCardless link", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create GoCardless link",
      });
    }
  },
};

export const enableBankingOperations = {
  async createLink(params: {
    country: string;
    institutionId: string;
    teamId: string;
    validUntil: string;
    state: string;
    type: "personal" | "business";
  }) {
    try {
      const api = new EnableBankingApi();
      return api.authenticate(params);
    } catch (error) {
      logger.error("Failed to create EnableBanking link", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create EnableBanking link",
      });
    }
  },

  async exchangeCode(code: string) {
    try {
      const api = new EnableBankingApi();
      return api.exchangeCode(code);
    } catch (error) {
      logger.error("Failed to exchange EnableBanking code", { error });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to exchange EnableBanking code",
      });
    }
  },
};
