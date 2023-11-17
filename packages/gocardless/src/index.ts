"use server";

import { client } from "@midday/kv";

const baseUrl = "https://bankaccountdata.gocardless.com";

const ONE_HOUR = 3600;
const ACCESS_VALID_FOR_DAYS = 180;
const MAX_HISTORICAL_DAYS = 730;

enum balanceType {
  interimBooked = "interimBooked",
  interimAvailable = "interimAvailable",
}

const keys = {
  accessToken: "go_cardless_access_token",
  refreshToken: "go_cardless_refresh_token",
};

async function getRefreshToken(refresh: string) {
  const res = await fetch(`${baseUrl}/api/v2/token/refresh/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh,
    }),
  });

  const result = await res.json();

  await client.set(keys.accessToken, result.access, {
    ex: result.access_expires - ONE_HOUR,
    nx: true,
  });

  return result;
}

async function getAccessToken() {
  const [accessToken, refreshToken] = await Promise.all([
    client.get(keys.accessToken),
    client.get(keys.refreshToken),
  ]);

  if (accessToken) {
    return accessToken;
  }

  if (refreshToken) {
    return getRefreshToken(refreshToken);
  }

  const res = await fetch(`${baseUrl}/api/v2/token/new/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
  });

  const result = await res.json();

  await Promise.all([
    client.set(keys.accessToken, result.access, {
      ex: result.access_expires - ONE_HOUR,
      nx: true,
    }),
    client.set(keys.refreshToken, result.refresh, {
      ex: result.refresh_expires - ONE_HOUR,
      nx: true,
    }),
  ]);

  return result;
}

export async function getBanks(countryCode: string) {
  const token = await getAccessToken();

  const res = await fetch(
    `${baseUrl}/api/v2/institutions/?country=${countryCode.toLowerCase()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.json();
}

export async function createEndUserAgreement(institutionId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/api/v2/agreements/enduser/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      institution_id: institutionId,
      access_scope: ["balances", "details", "transactions"],
      access_valid_for_days: ACCESS_VALID_FOR_DAYS,
      max_historical_days: MAX_HISTORICAL_DAYS,
    }),
  });

  return res.json();
}

type BuildLinkOptions = {
  institutionId: string;
  agreement: string;
  redirect: string;
};

export async function buildLink({
  institutionId,
  agreement,
  redirect,
}: BuildLinkOptions) {
  const token = await getAccessToken();

  const res = await fetch(`${baseUrl}/api/v2/requisitions/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      redirect,
      institution_id: institutionId,
      agreement,
    }),
  });

  return res.json();
}

export async function getAccountDetails(id: string) {
  const token = await getAccessToken();

  const [account, details] = await Promise.all([
    fetch(`${baseUrl}/api/v2/accounts/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
    fetch(`${baseUrl}/api/v2/accounts/${id}/details/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }),
  ]);

  const accountData = await account.json();
  const detailsData = await details.json();

  return {
    ...accountData,
    ...detailsData?.account,
  };
}

export async function getAccountBalancesById(id: string) {
  const token = await getAccessToken();

  const account = await fetch(`${baseUrl}/api/v2/accounts/${id}/balances/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return account.json();
}

type GetAccountsOptions = {
  accountId: string;
  countryCode: string;
};

export async function getAccounts({
  accountId,
  countryCode,
}: GetAccountsOptions) {
  const token = await getAccessToken();
  const banks = await getBanks(countryCode);

  const res = await fetch(`${baseUrl}/api/v2/requisitions/${accountId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  const result = await Promise.all(
    data.accounts?.map(async (id) => {
      const accountData = await getAccountDetails(id);
      const { balances } = await getAccountBalancesById(id);

      return {
        ...accountData,
        bank: banks.find((bank) => bank.id === accountData.institution_id),
        balances: {
          available: balances.find(
            (balance) => balance.balanceType === balanceType.interimAvailable
          )?.balanceAmount,
          boked: balances.find(
            (balance) => balance.balanceType === balanceType.interimBooked
          )?.balanceAmount,
        },
      };
    })
  );

  return result.sort((a, b) =>
    a.balances.available - b.balances.available ? 1 : -1
  );
}

export async function getTransactions(accountId: string) {
  const token = await getAccessToken();

  const result = await fetch(
    `${baseUrl}/api/v2/accounts/${accountId}/transactions/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return result.json();
}
