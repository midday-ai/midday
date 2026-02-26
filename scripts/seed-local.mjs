#!/usr/bin/env node
/**
 * DEPRECATED: Use `supabase db reset` which runs supabase/seed.sql.
 * This file is kept for reference only. All seed data is now consolidated
 * in supabase/seed.sql for deterministic, single-command seeding.
 *
 * Original description:
 * Seed demo data into LOCAL Supabase instance.
 * Assumes `npx supabase start` has been run.
 */
import pg from 'pg';
const { Client } = pg;

const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const USER_ID = '00000000-0000-0000-0000-000000000001';
const TEAM_ID = 'a0000000-0000-0000-0000-000000000001';
const BANK_OP = 'ba000000-0000-0000-0000-000000000001';
const BANK_RES = 'ba000000-0000-0000-0000-000000000002';

function formatDate(d) { return d.toISOString().split('T')[0]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d; }
function monthsAgo(n) { const d = new Date(); d.setMonth(d.getMonth() - n); d.setHours(0,0,0,0); return d; }
function businessDays(start, end) {
  const days = []; let d = new Date(start); d.setHours(0,0,0,0);
  const e = new Date(end); e.setHours(0,0,0,0);
  while (d <= e) { if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d)); d.setDate(d.getDate()+1); }
  return days;
}
function weeklyDays(start, end) {
  const days = []; let d = new Date(start); d.setHours(0,0,0,0);
  const e = new Date(end); e.setHours(0,0,0,0);
  while (d <= e) { if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d)); d.setDate(d.getDate()+7); }
  return days;
}

const client = new Client({ connectionString: DB_URL });

async function run() {
  await client.connect();
  console.log('Connected to local Supabase\n');

  // ── 1. User & Team Setup ──
  await client.query(`UPDATE public.users SET full_name = 'Suphian Tweel', team_id = $1 WHERE id = $2`, [TEAM_ID, USER_ID]);
  await client.query(`INSERT INTO public.users_on_team (user_id, team_id, role) VALUES ($1, $2, 'owner') ON CONFLICT DO NOTHING`, [USER_ID, TEAM_ID]);
  console.log('1. ✓ User linked to team');

  // ── 2. Bank Accounts ──
  await client.query(`
    INSERT INTO public.bank_accounts (id, team_id, created_by, name, currency, balance, type, manual, enabled, account_id) VALUES
      ($1, $3, $4, 'Abacus Capital Operating', 'USD', 847592.45, 'depository', true, true, 'manual_operating_001'),
      ($2, $3, $4, 'Abacus Capital Reserve', 'USD', 250000.00, 'depository', true, true, 'manual_reserve_001')
    ON CONFLICT (id) DO NOTHING
  `, [BANK_OP, BANK_RES, TEAM_ID, USER_ID]);
  console.log('2. ✓ Bank accounts created');

  // ── 3. Transaction Categories ──
  await client.query(`
    INSERT INTO public.transaction_categories (team_id, name, slug, color, description, system) VALUES
      ($1, 'MCA Payments', 'mca-payments', '#16a34a', 'Daily/weekly ACH payments from merchants', false),
      ($1, 'NSF Returns', 'nsf-returns', '#dc2626', 'Non-sufficient funds', false),
      ($1, 'Funding Disbursements', 'funding-disbursements', '#0ea5e9', 'Outgoing funds to merchants', false),
      ($1, 'ISO Commissions', 'iso-commissions', '#f97316', 'Broker/ISO commission payments', false),
      ($1, 'Operating Expenses', 'operating-expenses', '#6b7280', 'General business expenses', false)
    ON CONFLICT (team_id, slug) DO NOTHING
  `, [TEAM_ID]);
  console.log('3. ✓ Transaction categories created');

  // ── 4. Tags ──
  for (const name of ['VIP', 'High Risk', 'Renewal Ready', 'New Client', 'Seasonal']) {
    await client.query(`INSERT INTO public.tags (id, team_id, name) VALUES (gen_random_uuid(), $1, $2) ON CONFLICT (team_id, name) DO NOTHING`, [TEAM_ID, name]);
  }
  const tagRows = await client.query(`SELECT id, name FROM public.tags WHERE team_id = $1`, [TEAM_ID]);
  const tagMap = {};
  for (const t of tagRows.rows) tagMap[t.name] = t.id;

  // Get customer IDs
  const custRows = await client.query(`SELECT id, name FROM public.customers WHERE team_id = $1`, [TEAM_ID]);
  const cx = {};
  for (const c of custRows.rows) cx[c.name] = c.id;

  // Tag customers
  const customerTags = [
    [cx['Lucky Dragon Restaurant'], tagMap['VIP']],
    [cx['Lucky Dragon Restaurant'], tagMap['Renewal Ready']],
    [cx['Martinez Auto Repair'], tagMap['VIP']],
    [cx['Martinez Auto Repair'], tagMap['Renewal Ready']],
    [cx['Smith Plumbing Services'], tagMap['Renewal Ready']],
    [cx['Westside Construction LLC'], tagMap['High Risk']],
    [cx["Tony's Pizzeria"], tagMap['High Risk']],
    [cx["Tony's Pizzeria"], tagMap['Seasonal']],
    [cx['Green Thumb Landscaping'], tagMap['New Client']],
    [cx['Fitness First Gym'], tagMap['New Client']],
  ];
  for (const [cid, tid] of customerTags) {
    if (cid && tid) await client.query(`INSERT INTO public.customer_tags (id, customer_id, team_id, tag_id) VALUES (gen_random_uuid(), $1, $2, $3) ON CONFLICT (customer_id, tag_id) DO NOTHING`, [cid, TEAM_ID, tid]);
  }
  console.log('4. ✓ Tags created and applied');

  // ── 5. MCA Deals ──
  const deals = [
    { customer: 'Sunrise Diner',          code: 'MCA-2025-001', fund: 65000, rate: 1.35, payback: 87750,  daily: 485,  freq: 'daily',  status: 'active',   mo: 8,  balance: 5300,   paid: 82450,  nsf: 0 },
    { customer: 'Bella Salon & Spa',      code: 'MCA-2025-003', fund: 45000, rate: 1.38, payback: 62100,  daily: 275,  freq: 'daily',  status: 'active',   mo: 5,  balance: 31850,  paid: 30250,  nsf: 0 },
    { customer: "Tony's Pizzeria",        code: 'MCA-2025-004', fund: 60000, rate: 1.42, payback: 85200,  daily: 380,  freq: 'daily',  status: 'late',     mo: 6,  balance: 37800,  paid: 47400,  nsf: 2 },
    { customer: 'Quick Print Solutions',   code: 'MCA-2025-005', fund: 70000, rate: 1.40, payback: 98000,  daily: 425,  freq: 'daily',  status: 'active',   mo: 4,  balance: 61875,  paid: 36125,  nsf: 1 },
    { customer: 'Westside Construction LLC', code: 'MCA-2025-006', fund: 75000, rate: 1.45, payback: 108750, daily: 1890, freq: 'weekly', status: 'late',     mo: 7,  balance: 55050,  paid: 53700,  nsf: 4 },
    { customer: 'Green Thumb Landscaping', code: 'MCA-2026-001', fund: 40000, rate: 1.36, payback: 54400,  daily: 295,  freq: 'daily',  status: 'active',   daysBack: 14, balance: 51450, paid: 2950, nsf: 0 },
    { customer: 'Fitness First Gym',      code: 'MCA-2026-002', fund: 80000, rate: 1.34, payback: 107200, daily: 510,  freq: 'daily',  status: 'active',   daysBack: 7, balance: 104650, paid: 2550, nsf: 0 },
    { customer: 'Martinez Auto Repair',   code: 'MCA-2024-001', fund: 50000, rate: 1.32, payback: 66000,  daily: 320,  freq: 'daily',  status: 'paid_off', mo: 14, balance: 0,      paid: 66000,  nsf: 0 },
    { customer: 'Lucky Dragon Restaurant', code: 'MCA-2024-002', fund: 75000, rate: 1.35, payback: 101250, daily: 450,  freq: 'daily',  status: 'paid_off', mo: 18, balance: 0,      paid: 101250, nsf: 0 },
    { customer: 'Smith Plumbing Services', code: 'MCA-2024-003', fund: 50000, rate: 1.33, payback: 66500,  daily: 350,  freq: 'daily',  status: 'paid_off', mo: 12, balance: 0,      paid: 66500,  nsf: 0 },
  ];

  const dealIds = {};
  for (const d of deals) {
    const funded = d.daysBack ? daysAgo(d.daysBack) : monthsAgo(d.mo);
    const res = await client.query(`
      INSERT INTO public.mca_deals (team_id, customer_id, deal_code, funding_amount, factor_rate, payback_amount, daily_payment, payment_frequency, status, funded_at, current_balance, total_paid, nsf_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (team_id, deal_code) DO NOTHING
      RETURNING id
    `, [TEAM_ID, cx[d.customer], d.code, d.fund, d.rate, d.payback, d.daily, d.freq, d.status, funded.toISOString(), d.balance, d.paid, d.nsf]);
    if (res.rows.length) dealIds[d.code] = res.rows[0].id;
  }
  console.log(`5. ✓ ${Object.keys(dealIds).length} MCA deals created`);

  // ── 6. Transactions ──
  const today = new Date(); today.setHours(0,0,0,0);

  // Deal code lookup
  const codeToDealCode = {
    sunrise: 'MCA-2025-001', martinez: 'MCA-2024-001', bella: 'MCA-2025-003',
    tonys: 'MCA-2025-004', quickprint: 'MCA-2025-005', luckydragon: 'MCA-2024-002',
    smith: 'MCA-2024-003', greenthumb: 'MCA-2026-001', fitness: 'MCA-2026-002',
    westside: 'MCA-2025-006',
  };

  // Income: MCA payments
  const merchants = [
    { name: 'Sunrise Diner',          amt: 485,  start: monthsAgo(8),  end: today, code: 'sunrise' },
    { name: 'Martinez Auto Repair',   amt: 320,  start: monthsAgo(14), end: monthsAgo(4), code: 'martinez' },
    { name: 'Bella Salon & Spa',      amt: 275,  start: monthsAgo(5),  end: today, code: 'bella' },
    { name: "Tony's Pizzeria",        amt: 380,  start: monthsAgo(6),  end: today, code: 'tonys' },
    { name: 'Quick Print Solutions',   amt: 425,  start: monthsAgo(4),  end: today, code: 'quickprint' },
    { name: 'Lucky Dragon Restaurant', amt: 450,  start: monthsAgo(18), end: monthsAgo(7), code: 'luckydragon' },
    { name: 'Smith Plumbing Services', amt: 350,  start: monthsAgo(12), end: monthsAgo(3), code: 'smith' },
    { name: 'Green Thumb Landscaping', amt: 295,  start: daysAgo(14),   end: today, code: 'greenthumb' },
    { name: 'Fitness First Gym',      amt: 510,  start: daysAgo(7),    end: today, code: 'fitness' },
  ];

  let txnCount = 0;
  for (const m of merchants) {
    const days = businessDays(m.start, m.end);
    for (const d of days) {
      await client.query(`
        INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, deal_code, internal_id)
        VALUES ($1, $2, $3, $4, $5, $6, 'USD', 'mca-payments', 'posted', 'ach', $7, $8)
        ON CONFLICT (internal_id) DO NOTHING
      `, [TEAM_ID, BANK_OP, formatDate(d), `${m.name} - ACH Payment`, `Daily MCA payment`, m.amt, codeToDealCode[m.code], `demo_mca_${m.code}_${formatDate(d).replace(/-/g,'')}`]);
      txnCount++;
    }
    process.stdout.write(`\r6. Inserting transactions... ${txnCount}`);
  }

  // Westside weekly
  for (const d of weeklyDays(monthsAgo(7), today)) {
    await client.query(`
      INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, deal_code, internal_id)
      VALUES ($1, $2, $3, 'Westside Construction LLC - Weekly ACH', 'Weekly MCA payment', 1890, 'USD', 'mca-payments', 'posted', 'ach', $4, $5)
      ON CONFLICT (internal_id) DO NOTHING
    `, [TEAM_ID, BANK_OP, formatDate(d), codeToDealCode.westside, `demo_mca_westside_${formatDate(d).replace(/-/g,'')}`]);
    txnCount++;
  }

  // NSF returns
  const nsfs = [
    { name: "Tony's Pizzeria - NSF Return", amt: -380, days: 25, code: 'tonys_1', dealCode: 'MCA-2025-004' },
    { name: "Tony's Pizzeria - NSF Return", amt: -380, days: 12, code: 'tonys_2', dealCode: 'MCA-2025-004' },
    { name: 'Quick Print Solutions - NSF Return', amt: -425, days: 8, code: 'quickprint_1', dealCode: 'MCA-2025-005' },
    { name: 'Westside Construction - NSF Return', amt: -1890, days: 40, code: 'westside_1', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amt: -1890, days: 33, code: 'westside_2', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amt: -1890, days: 19, code: 'westside_3', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amt: -1890, days: 5, code: 'westside_4', dealCode: 'MCA-2025-006' },
  ];
  for (const n of nsfs) {
    await client.query(`INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, deal_code, internal_id) VALUES ($1, $2, $3, $4, 'Returned ACH - insufficient funds', $5, 'USD', 'nsf-returns', 'posted', 'ach', $6, $7) ON CONFLICT (internal_id) DO NOTHING`,
      [TEAM_ID, BANK_OP, formatDate(daysAgo(n.days)), n.name, n.amt, n.dealCode, `demo_nsf_${n.code}`]);
    txnCount++;
  }

  // Funding disbursements
  const fundings = [
    { name: 'Funding - Lucky Dragon Restaurant', amt: -75000, mo: 18, mcode: 'luckydragon' },
    { name: 'Funding - Martinez Auto Repair', amt: -50000, mo: 14, mcode: 'martinez' },
    { name: 'Funding - Smith Plumbing Services', amt: -50000, mo: 12, mcode: 'smith' },
    { name: 'Funding - Sunrise Diner', amt: -65000, mo: 8, mcode: 'sunrise' },
    { name: 'Funding - Westside Construction', amt: -75000, mo: 7, mcode: 'westside' },
    { name: "Funding - Tony's Pizzeria", amt: -60000, mo: 6, mcode: 'tonys' },
    { name: 'Funding - Bella Salon & Spa', amt: -45000, mo: 5, mcode: 'bella' },
    { name: 'Funding - Quick Print Solutions', amt: -70000, mo: 4, mcode: 'quickprint' },
    { name: 'Funding - Green Thumb Landscaping', amt: -40000, daysBack: 14, mcode: 'greenthumb' },
    { name: 'Funding - Fitness First Gym', amt: -80000, daysBack: 7, mcode: 'fitness' },
  ];
  for (const f of fundings) {
    const d = f.daysBack ? daysAgo(f.daysBack) : monthsAgo(f.mo);
    const code = f.name.split(' - ')[1].toLowerCase().replace(/[^a-z]/g,'').slice(0,12);
    await client.query(`INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, deal_code, internal_id) VALUES ($1, $2, $3, $4, 'MCA funding disbursement', $5, 'USD', 'funding-disbursements', 'posted', 'wire', $6, $7) ON CONFLICT (internal_id) DO NOTHING`,
      [TEAM_ID, BANK_OP, formatDate(d), f.name, f.amt, codeToDealCode[f.mcode], `demo_fund_${code}`]);
    txnCount++;
  }

  // ISO commissions
  const isos = [
    { name: 'ISO Commission - Pinnacle Funding Group', amt: -7500, mo: 18, mcode: 'luckydragon' },
    { name: 'ISO Commission - Capital Brokers LLC', amt: -5000, mo: 14, mcode: 'martinez' },
    { name: 'ISO Commission - Southwest Funding Partners', amt: -5500, mo: 12, mcode: 'smith' },
    { name: 'ISO Commission - Pinnacle Funding Group', amt: -6500, mo: 8, mcode: 'sunrise' },
    { name: 'ISO Commission - Capital Brokers LLC', amt: -8250, mo: 7, mcode: 'westside' },
    { name: 'ISO Commission - Southwest Funding Partners', amt: -6600, mo: 6, mcode: 'tonys' },
    { name: 'ISO Commission - Pinnacle Funding Group', amt: -4950, mo: 5, mcode: 'bella' },
    { name: 'ISO Commission - Capital Brokers LLC', amt: -7700, mo: 4, mcode: 'quickprint' },
    { name: 'ISO Commission - Southwest Funding Partners', amt: -4400, daysBack: 14, mcode: 'greenthumb' },
    { name: 'ISO Commission - Pinnacle Funding Group', amt: -8800, daysBack: 7, mcode: 'fitness' },
  ];
  for (const iso of isos) {
    const d = iso.daysBack ? daysAgo(iso.daysBack) : monthsAgo(iso.mo);
    const code = iso.mo ? `iso_${iso.mo}mo` : `iso_${iso.daysBack}d`;
    await client.query(`INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, deal_code, internal_id) VALUES ($1, $2, $3, $4, 'Broker commission payment', $5, 'USD', 'iso-commissions', 'posted', 'ach', $6, $7) ON CONFLICT (internal_id) DO NOTHING`,
      [TEAM_ID, BANK_OP, formatDate(d), iso.name, iso.amt, codeToDealCode[iso.mcode], `demo_${code}`]);
    txnCount++;
  }

  // Operating expenses
  const opex = [
    { name: 'Office Lease - 500 Commerce St', amt: -3500, method: 'payment', code: 'rent', day: 1 },
    { name: 'Gusto Payroll', amt: -12000, method: 'ach', code: 'payroll', day: 15 },
    { name: 'Mercury - Software Stack', amt: -850, method: 'card_purchase', code: 'software', day: 5 },
    { name: 'Thompson & Associates', amt: -1200, method: 'ach', code: 'legal', day: 10 },
    { name: 'State Farm Insurance', amt: -600, method: 'ach', code: 'insurance', day: 8 },
    { name: 'AT&T Business', amt: -350, method: 'ach', code: 'telecom', day: 12 },
    { name: 'Office Depot', amt: -175, method: 'card_purchase', code: 'supplies', day: 20 },
  ];
  for (let i = 12; i >= 0; i--) {
    for (const exp of opex) {
      const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(Math.min(exp.day, 28));
      if (d <= today) {
        await client.query(`INSERT INTO public.transactions (team_id, bank_account_id, date, name, description, amount, currency, category_slug, status, method, internal_id) VALUES ($1, $2, $3, $4, $4, $5, 'USD', 'operating-expenses', 'posted', $6, $7) ON CONFLICT (internal_id) DO NOTHING`,
          [TEAM_ID, BANK_OP, formatDate(d), exp.name, exp.amt, exp.method, `demo_opex_${exp.code}_${formatDate(d).replace(/-/g,'').slice(0,6)}`]);
        txnCount++;
      }
    }
  }

  console.log(`\n6. ✓ ${txnCount} transactions inserted`);

  // ── 7. MCA Payments ──
  let pmtCount = 0;
  for (const m of merchants) {
    const dealCode = deals.find(d => d.customer === m.name)?.code;
    const dealId = dealIds[dealCode];
    if (!dealId) continue;
    const days = businessDays(m.start, m.end);
    for (const d of days) {
      await client.query(`INSERT INTO public.mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description) VALUES ($1, $2, $3, $4, 'ach', 'completed', 'Daily ACH payment')`,
        [dealId, TEAM_ID, m.amt, formatDate(d)]);
      pmtCount++;
    }
    process.stdout.write(`\r7. Inserting MCA payments... ${pmtCount}`);
  }
  // Westside weekly payments
  const westsideDealId = dealIds['MCA-2025-006'];
  if (westsideDealId) {
    for (const d of weeklyDays(monthsAgo(7), today)) {
      await client.query(`INSERT INTO public.mca_payments (deal_id, team_id, amount, payment_date, payment_type, status, description) VALUES ($1, $2, 1890, $3, 'ach', 'completed', 'Weekly ACH payment')`,
        [westsideDealId, TEAM_ID, formatDate(d)]);
      pmtCount++;
    }
  }
  console.log(`\n7. ✓ ${pmtCount} MCA payment records inserted`);

  // ── 8. Invoice Template ──
  const tplRes = await client.query(`INSERT INTO public.invoice_templates (team_id, name, is_default, currency, size) VALUES ($1, 'Default', true, 'USD', 'letter') ON CONFLICT DO NOTHING RETURNING id`, [TEAM_ID]);
  const tplId = tplRes.rows[0]?.id || (await client.query(`SELECT id FROM invoice_templates WHERE team_id = $1 LIMIT 1`, [TEAM_ID])).rows[0]?.id;
  console.log('8. ✓ Invoice template created');

  // ── 9. Invoices ──
  const invoices = [
    { num: 'D-0001', status: 'paid', cust: 'Lucky Dragon Restaurant', amt: 75000, issued: monthsAgo(18), due: monthsAgo(17), item: 'MCA Funding - MCA-2024-002' },
    { num: 'D-0002', status: 'paid', cust: 'Martinez Auto Repair', amt: 50000, issued: monthsAgo(14), due: monthsAgo(13), item: 'MCA Funding - MCA-2024-001' },
    { num: 'D-0003', status: 'paid', cust: 'Smith Plumbing Services', amt: 50000, issued: monthsAgo(12), due: monthsAgo(11), item: 'MCA Funding - MCA-2024-003' },
    { num: 'D-0004', status: 'paid', cust: 'Sunrise Diner', amt: 65000, issued: monthsAgo(8), due: monthsAgo(7), item: 'MCA Funding - MCA-2025-001' },
    { num: 'D-0005', status: 'paid', cust: 'Westside Construction LLC', amt: 75000, issued: monthsAgo(7), due: monthsAgo(6), item: 'MCA Funding - MCA-2025-006' },
    { num: 'D-0006', status: 'paid', cust: "Tony's Pizzeria", amt: 60000, issued: monthsAgo(6), due: monthsAgo(5), item: 'MCA Funding - MCA-2025-004' },
    { num: 'D-0007', status: 'paid', cust: 'Bella Salon & Spa', amt: 45000, issued: monthsAgo(5), due: monthsAgo(4), item: 'MCA Funding - MCA-2025-003' },
    { num: 'D-0008', status: 'paid', cust: 'Quick Print Solutions', amt: 70000, issued: monthsAgo(4), due: monthsAgo(3), item: 'MCA Funding - MCA-2025-005' },
    { num: 'D-0009', status: 'unpaid', cust: 'Green Thumb Landscaping', amt: 40000, issued: daysAgo(14), due: daysAgo(-16), item: 'MCA Funding - MCA-2026-001' },
    { num: 'D-0010', status: 'unpaid', cust: 'Fitness First Gym', amt: 80000, issued: daysAgo(7), due: daysAgo(-23), item: 'MCA Funding - MCA-2026-002' },
    { num: 'D-0011', status: 'overdue', cust: 'Westside Construction LLC', amt: 2500, issued: monthsAgo(2), due: monthsAgo(1), item: 'Legal fees - Collections review' },
    { num: 'D-0012', status: 'draft', cust: 'Lucky Dragon Restaurant', amt: 100000, issued: new Date(), due: daysAgo(-30), item: 'MCA Renewal Offer - Up to $100,000' },
    { num: 'D-0013', status: 'draft', cust: 'Smith Plumbing Services', amt: 75000, issued: new Date(), due: daysAgo(-30), item: 'MCA Renewal Offer - Up to $75,000' },
  ];
  for (const inv of invoices) {
    await client.query(`
      INSERT INTO public.invoices (team_id, customer_id, user_id, template_id, invoice_number, status, issue_date, due_date, amount, subtotal, currency, customer_name, line_items, token)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 'USD', $10, $11, $12)
    `, [TEAM_ID, cx[inv.cust], USER_ID, tplId, inv.num, inv.status, inv.issued.toISOString(), inv.due.toISOString(), inv.amt, inv.cust, JSON.stringify([{name: inv.item, quantity: 1, price: inv.amt}]), `tok_${inv.num.toLowerCase().replace(/-/g,'_')}`]);
  }
  console.log(`9. ✓ ${invoices.length} invoices created`);

  // ── Summary ──
  const counts = await client.query(`
    SELECT
      (SELECT count(*) FROM transactions WHERE team_id = $1) as txns,
      (SELECT count(*) FROM mca_deals WHERE team_id = $1) as deals,
      (SELECT count(*) FROM mca_payments WHERE team_id = $1) as pmts,
      (SELECT count(*) FROM invoices WHERE team_id = $1) as invs,
      (SELECT count(*) FROM customers WHERE team_id = $1) as custs,
      (SELECT count(*) FROM bank_accounts WHERE team_id = $1) as banks
  `, [TEAM_ID]);
  const c = counts.rows[0];

  console.log('\n' + '='.repeat(50));
  console.log('✅ Local demo data seeded!');
  console.log(`   Transactions:  ${c.txns}`);
  console.log(`   MCA Deals:     ${c.deals}`);
  console.log(`   MCA Payments:  ${c.pmts}`);
  console.log(`   Invoices:      ${c.invs}`);
  console.log(`   Customers:     ${c.custs}`);
  console.log(`   Bank Accounts: ${c.banks}`);
  console.log('='.repeat(50));

  await client.end();
}

run().catch(async err => {
  console.error('\n❌ Error:', err.message);
  if (err.detail) console.error('Detail:', err.detail);
  await client.end();
  process.exit(1);
});
