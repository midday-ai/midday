"use server";

import { env } from "@/env.mjs";

const baseUrl = "https://bankaccountdata.gocardless.com";

enum balanceType {
  interimBooked = "interimBooked",
  interimAvailable = "interimAvailable",
}

export async function getAccessToken() {
  const res = await fetch(`${baseUrl}/api/v2/token/new/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      secret_id: env.GOCARDLESS_SECRET_ID,
      secret_key: env.GOCARDLESS_SECRET_KEY,
    }),
  });

  const json = await res.json();

  return json;
}

type GetBanksOptions = {
  token: string;
  country: "se";
};

export async function getBanks({ token, country }: GetBanksOptions) {
  const res = await fetch(
    `${baseUrl}/api/v2/institutions/?country=${country}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.json();
}

type CreateEndUserAgreementOptions = {
  token: string;
  institutionId: string;
};

export async function createEndUserAgreement({
  token,
  institutionId,
}: CreateEndUserAgreementOptions) {
  const res = await fetch(`${baseUrl}/api/v2/agreements/enduser/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      institution_id: institutionId,
      access_scope: ["balances", "details", "transactions"],
      access_valid_for_days: 180,
      max_historical_days: 730,
    }),
  });

  return res.json();
}

type BuildLinkOptions = {
  token: string;
  institutionId: string;
  agreement: string;
  redirect: string;
};

export async function buildLink({
  token,
  institutionId,
  agreement,
  redirect,
}: BuildLinkOptions) {
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

type GetAccountByIdOptions = {
  token: string;
  id: string;
};

export async function getAccountById({ id, token }: GetAccountByIdOptions) {
  const account = await fetch(`${baseUrl}/api/v2/accounts/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return account.json();
}

type GetAccountsOptions = {
  token: string;
  id: string;
};

type GetAccountBalancesByIdOptions = {
  token: string;
  id: string;
};

export async function getAccountBalancesById({
  id,
  token,
}: GetAccountBalancesByIdOptions) {
  const account = await fetch(`${baseUrl}/api/v2/accounts/${id}/balances/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return account.json();
}

export async function getAccounts({ token, id }: GetAccountsOptions) {
  const banks = await getBanks({ token, country: "se" });

  const res = await fetch(`${baseUrl}/api/v2/requisitions/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  const result = await Promise.all(
    data.accounts.map(async (id) => {
      const accountData = await getAccountById({ token, id });
      const { balances } = await getAccountBalancesById({ token, id });

      return {
        ...accountData,
        bank: banks.find((bank) => bank.id === accountData.institution_id),
        balances: {
          available: balances.find(
            (balance) => balance.balanceType === balanceType.interimAvailable,
          )?.balanceAmount,
          boked: balances.find(
            (balance) => balance.balanceType === balanceType.interimBooked,
          )?.balanceAmount,
        },
      };
    }),
  );

  return result.sort((a, b) =>
    a.balances.available - b.balances.available ? 1 : -1,
  );
}
