-- Migration: Create missing SQL functions for bank account queries
-- Purpose: The TRPC router calls these functions via raw SQL but they were never created.

-- 1. get_bank_account_currencies(team_id uuid)
--    Returns distinct currencies for a team's enabled bank accounts.
CREATE OR REPLACE FUNCTION public.get_bank_account_currencies(team_id uuid)
RETURNS TABLE(currency text) AS $$
  SELECT DISTINCT ba.currency
  FROM public.bank_accounts ba
  WHERE ba.team_id = get_bank_account_currencies.team_id
    AND ba.enabled = true
    AND ba.currency IS NOT NULL
  ORDER BY ba.currency;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. get_team_bank_accounts_balances(team_id uuid)
--    Returns account balances with name and logo for a team's enabled accounts.
CREATE OR REPLACE FUNCTION public.get_team_bank_accounts_balances(team_id uuid)
RETURNS TABLE(
  id uuid,
  currency text,
  balance numeric,
  name text,
  logo_url text
) AS $$
  SELECT
    ba.id,
    ba.currency,
    ba.balance,
    ba.name,
    bc.logo_url
  FROM public.bank_accounts ba
  LEFT JOIN public.bank_connections bc ON ba.bank_connection_id = bc.id
  WHERE ba.team_id = get_team_bank_accounts_balances.team_id
    AND ba.enabled = true
  ORDER BY ba.name;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
