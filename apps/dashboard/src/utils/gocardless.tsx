"use server";

import { env } from "@/env.mjs";

const baseUrl = "https://bankaccountdata.gocardless.com";

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

  const json = await res.json();

  return json;
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

  const json = await res.json();

  return json;
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

  const json = await res.json();

  return json;
}

type ListAccountsOptions = {
  token: string;
  id: string;
};

export async function listAccounts({ id, token }: ListAccountsOptions) {
  const res = await fetch(`${baseUrl}/api/v2/requisitions/${id}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const { accounts } = await res.json();

  const katt = await Promise.all(
    accounts.map(async (accountId) => {
      const res = await fetch(`${baseUrl}/api/v2/accounts/${accountId}/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return res.json();
    }),
  );

  console.log(katt);
}
