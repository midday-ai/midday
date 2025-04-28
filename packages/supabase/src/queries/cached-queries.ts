import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "../client/server";
import {
  type GetCustomersQueryParams,
  type GetInvoiceSummaryParams,
  type GetInvoicesQueryParams,
  getBankConnectionsByTeamIdQuery,
  getCustomersQuery,
  getInvoiceSummaryQuery,
  getInvoiceTemplatesQuery,
  getInvoicesQuery,
  getLastInvoiceNumberQuery,
  getPaymentStatusQuery,
  getTeamSettingsQuery,
  getUserQuery,
} from "../queries";

// Cache per request
export const getSession = cache(async () => {
  const supabase = await createClient();

  return supabase.auth.getSession();
});

// Cache per request and revalidate every 30 minutes
export const getUser = cache(async () => {
  const {
    data: { session },
  } = await getSession();

  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const supabase = await createClient();

  return unstable_cache(
    async () => {
      return getUserQuery(supabase, userId);
    },
    ["user", userId],
    {
      tags: [`user_${userId}`],
      // 30 minutes, jwt expires in 1 hour
      revalidate: 1800,
    },
  )();
});

export const getBankConnectionsByTeamId = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getBankConnectionsByTeamIdQuery(supabase, teamId);
    },
    ["bank_connections", teamId],
    {
      tags: [`bank_connections_${teamId}`],
      revalidate: 3600,
    },
  )(teamId);
};

export const getTeamSettings = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getTeamSettingsQuery(supabase, teamId);
    },
    ["team_settings", teamId],
    {
      tags: [`team_settings_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getInvoiceSummary = async (
  params?: Omit<GetInvoiceSummaryParams, "teamId">,
) => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  return unstable_cache(
    async () => {
      return getInvoiceSummaryQuery(supabase, { ...params, teamId });
    },
    ["invoice_summary", teamId],
    {
      tags: [`invoice_summary_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getPaymentStatus = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getPaymentStatusQuery(supabase, teamId);
    },
    ["payment_status", teamId],
    {
      tags: [`payment_status_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getCustomers = async (
  params?: Omit<GetCustomersQueryParams, "teamId">,
) => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getCustomersQuery(supabase, { ...params, teamId });
    },
    ["customers", teamId],
    {
      tags: [`customers_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getInvoices = async (
  params?: Omit<GetInvoicesQueryParams, "teamId">,
) => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getInvoicesQuery(supabase, { ...params, teamId });
    },
    ["invoices", teamId],
    {
      tags: [`invoices_${teamId}`],
      revalidate: 3600,
    },
  )(params);
};

export const getInvoiceTemplates = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getInvoiceTemplatesQuery(supabase, teamId);
    },
    ["invoice_templates", teamId],
    {
      tags: [`invoice_templates_${teamId}`],
      revalidate: 3600,
    },
  )();
};

export const getLastInvoiceNumber = async () => {
  const supabase = await createClient();
  const user = await getUser();
  const teamId = user?.data?.team_id;

  if (!teamId) {
    return null;
  }

  return unstable_cache(
    async () => {
      return getLastInvoiceNumberQuery(supabase, teamId);
    },
    ["invoice_number", teamId],
    {
      tags: [`invoice_number_${teamId}`],
      revalidate: 3600,
    },
  )();
};
