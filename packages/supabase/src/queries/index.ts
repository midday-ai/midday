// @ts-nocheck
import {
  endOfMonth,
  formatISO,
  parseISO,
  startOfMonth,
  subYears,
} from "date-fns";
import type { Client } from "../types";

export async function getUserQuery(supabase: Client, userId: string) {
  return supabase
    .from("users")
    .select(
      `
      *,
      team:team_id(*)
    `,
    )
    .eq("id", userId)
    .single()
    .throwOnError();
}

type GetUserInviteQueryParams = {
  code: string;
  email: string;
};

export async function getUserInviteQuery(
  supabase: Client,
  params: GetUserInviteQueryParams,
) {
  return supabase
    .from("user_invites")
    .select("*")
    .eq("code", params.code)
    .eq("email", params.email)
    .single();
}

export type GetInvoiceSummaryParams = {
  teamId: string;
  status?: "paid" | "canceled" | "overdue" | "unpaid" | "draft";
};

export async function getInvoiceSummaryQuery(
  supabase: Client,
  params: GetInvoiceSummaryParams,
) {
  const { teamId, status } = params;

  return supabase.rpc("get_invoice_summary", {
    team_id: teamId,
    status,
  });
}

export async function getPaymentStatusQuery(supabase: Client, teamId: string) {
  return supabase
    .rpc("get_payment_score", {
      team_id: teamId,
    })
    .single();
}

export async function getInvoiceTemplateQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase
    .from("invoice_templates")
    .select(`
      id,
      customer_label,
      from_label,
      invoice_no_label,
      issue_date_label,
      due_date_label,
      description_label,
      price_label,
      quantity_label,
      total_label,
      vat_label,
      tax_label,
      payment_label,
      note_label,
      logo_url,
      currency,
      subtotal_label,
      payment_details,
      from_details,
      size,
      date_format,
      include_vat,
      include_tax,
      tax_rate,
      delivery_type,
      discount_label,
      include_discount,
      include_decimals,
      include_qr,
      total_summary_label,
      title,
      vat_rate,
      include_units,
      include_pdf
    `)
    .eq("team_id", teamId)
    .single();
}

export async function getInvoiceByIdQuery(supabase: Client, id: string) {
  return supabase
    .from("invoices")
    .select(
      `
      id,
      due_date,
      invoice_number,
      amount,
      created_at,
      currency,
      line_items,
      payment_details,
      customer_details,
      reminder_sent_at,
      updated_at,
      status,
      note,
      internal_note,
      paid_at,
      vat,
      tax,
      file_path,
      viewed_at,
      from_details,
      issue_date,
      template,
      sent_at,
      note_details,
      customer_name,
      customer_id,
      token,
      sent_to,
      discount,
      subtotal,
      top_block,
      bottom_block,
      customer:customer_id(name, website, email),
      team:team_id(name),
      vat,
      tax
    `,
    )
    .eq("id", id)
    .single();
}

type SearchInvoiceNumberParams = {
  teamId: string;
  query: string;
};

export async function searchInvoiceNumberQuery(
  supabase: Client,
  params: SearchInvoiceNumberParams,
) {
  return supabase
    .from("invoices")
    .select("invoice_number")
    .eq("team_id", params.teamId)
    .ilike("invoice_number", `%${params.query}`)
    .single();
}

export async function getNextInvoiceNumberQuery(
  supabase: Client,
  teamId: string,
) {
  return supabase.rpc("get_next_invoice_number", {
    team_id: teamId,
  });
}

export async function getTeamByIdQuery(supabase: Client, teamId: string) {
  return supabase.from("teams").select("*").eq("id", teamId).single();
}

export async function getInboxAccountByIdQuery(supabase: Client, id: string) {
  return supabase
    .from("inbox_accounts")
    .select(
      "id, email, provider, access_token, refresh_token, expiry_date, last_accessed",
    )
    .eq("id", id)
    .single();
}

export async function getExistingInboxAttachmentsQuery(
  supabase: Client,
  inputArray: string[],
) {
  return supabase
    .from("inbox")
    .select("reference_id")
    .in("reference_id", inputArray);
}
