#!/usr/bin/env node
/**
 * Seed comprehensive demo data for Abacus dashboard via Supabase REST API.
 *
 * Usage: node scripts/seed-demo-data.mjs
 *
 * Populates: bank_accounts, transactions (~1200+), invoices, tags, customer_tags
 */

const SUPABASE_URL = 'https://ubbkuicqxbpagwfyidke.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYmt1aWNxeGJwYWd3ZnlpZGtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc3MzcxNSwiZXhwIjoyMDg0MzQ5NzE1fQ.Ok3Q4DVc-u6USP_-AEfuouQ4uS8dzkAASZJ2td9pWCs';

const TEAM_ID = 'a0000000-0000-0000-0000-000000000001';
const BANK_OP_ID = 'ba000000-0000-0000-0000-000000000001';
const BANK_RES_ID = 'ba000000-0000-0000-0000-000000000002';
const USER_EMAIL = 'suph.tweel@gmail.com';

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
};

// ============================================================================
// Helpers
// ============================================================================

function uuid() {
  return crypto.randomUUID();
}

function isBusinessDay(date) {
  const dow = date.getDay();
  return dow !== 0 && dow !== 6;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

function daysAgo(n) {
  return addDays(new Date(), -n);
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateBusinessDays(startDate, endDate) {
  const days = [];
  let d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    if (isBusinessDay(d)) {
      days.push(new Date(d));
    }
    d = addDays(d, 1);
  }
  return days;
}

function generateWeeklyDays(startDate, endDate) {
  const days = [];
  let d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    if (isBusinessDay(d)) {
      days.push(new Date(d));
    }
    d = addDays(d, 7);
  }
  return days;
}

function monthlyDates(monthsBack, dayOfMonth) {
  const dates = [];
  for (let i = monthsBack; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    if (d <= new Date()) {
      dates.push(d);
    }
  }
  return dates;
}

async function upsert(table, rows, options = {}) {
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const h = { ...headers };
    if (options.onConflict) {
      h['Prefer'] = `resolution=merge-duplicates`;
    }

    const queryParams = options.onConflict ? `?on_conflict=${options.onConflict}` : '';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${queryParams}`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const err = await res.json();
      // If it's a duplicate key error, skip and continue
      if (err.code === '23505') {
        console.log(`  ⚠ Skipping duplicates in batch ${i / batchSize + 1}`);
        continue;
      }
      throw new Error(`${table} insert failed: ${err.message} (${err.code})`);
    }
    inserted += batch.length;
  }
  return inserted;
}

async function fetchAll(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${table}`);
  return res.json();
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🏗️  Seeding demo data for Abacus dashboard...\n');

  // ------------------------------------------------------------------
  // 1. Look up existing data
  // ------------------------------------------------------------------
  console.log('1. Looking up existing data...');

  const [users, customers, existingTxns] = await Promise.all([
    fetchAll('users', `email=eq.${USER_EMAIL}`),
    fetchAll('customers', `team_id=eq.${TEAM_ID}&order=name`),
    fetchAll('transactions', `team_id=eq.${TEAM_ID}&internal_id=like.demo_*&select=internal_id&limit=1`),
  ]);

  if (!users.length) {
    console.error('❌ User not found. Aborting.');
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`   User: ${users[0].full_name} (${userId})`);
  console.log(`   Customers: ${customers.length}`);

  if (existingTxns.length > 0) {
    console.log('   ⚠ Demo data already exists. Skipping to avoid duplicates.');
    console.log('   To re-seed, first delete transactions with internal_id starting with "demo_".');
    process.exit(0);
  }

  // Build customer lookup
  const cx = {};
  for (const c of customers) {
    cx[c.name] = c.id;
  }

  if (!cx['Sunrise Diner']) {
    console.error('❌ Customers not found. Run the initial seed migration first.');
    process.exit(1);
  }

  // ------------------------------------------------------------------
  // 2. Additional Bank Account
  // ------------------------------------------------------------------
  console.log('\n2. Creating reserve bank account...');

  await upsert('bank_accounts', [{
    id: BANK_RES_ID,
    team_id: TEAM_ID,
    created_by: userId,
    name: 'Abacus Capital Reserve',
    currency: 'USD',
    balance: 250000.00,
    type: 'depository',
    manual: true,
    enabled: true,
    account_id: 'manual_reserve_001',
  }], { onConflict: 'id' });
  console.log('   ✓ Reserve account created ($250,000)');

  // ------------------------------------------------------------------
  // 3. Tags
  // ------------------------------------------------------------------
  console.log('\n3. Creating tags...');

  const tagNames = ['VIP', 'High Risk', 'Renewal Ready', 'New Client', 'Seasonal'];
  const tagRows = tagNames.map(name => ({
    id: uuid(),
    team_id: TEAM_ID,
    name,
  }));

  try {
    await upsert('tags', tagRows, { onConflict: 'team_id,name' });
  } catch (e) {
    console.log('   Tags may already exist, continuing...');
  }

  // Fetch tags to get their IDs
  const tags = await fetchAll('tags', `team_id=eq.${TEAM_ID}`);
  const tagMap = {};
  for (const t of tags) tagMap[t.name] = t.id;

  // Tag customers
  const customerTags = [
    { customer: 'Lucky Dragon Restaurant', tags: ['VIP', 'Renewal Ready'] },
    { customer: 'Martinez Auto Repair', tags: ['VIP', 'Renewal Ready'] },
    { customer: 'Smith Plumbing Services', tags: ['Renewal Ready'] },
    { customer: 'Westside Construction LLC', tags: ['High Risk'] },
    { customer: "Tony's Pizzeria", tags: ['High Risk', 'Seasonal'] },
    { customer: 'Green Thumb Landscaping', tags: ['New Client'] },
    { customer: 'Fitness First Gym', tags: ['New Client'] },
  ];

  const ctRows = [];
  for (const ct of customerTags) {
    for (const tagName of ct.tags) {
      if (cx[ct.customer] && tagMap[tagName]) {
        ctRows.push({
          id: uuid(),
          customer_id: cx[ct.customer],
          team_id: TEAM_ID,
          tag_id: tagMap[tagName],
        });
      }
    }
  }

  try {
    await upsert('customer_tags', ctRows, { onConflict: 'customer_id,tag_id' });
    console.log(`   ✓ ${ctRows.length} customer tags applied`);
  } catch (e) {
    console.log('   Tags may already be applied, continuing...');
  }

  // ------------------------------------------------------------------
  // 4. Transaction Categories
  // ------------------------------------------------------------------
  console.log('\n4. Ensuring transaction categories exist...');

  const categories = [
    { team_id: TEAM_ID, name: 'MCA Payments', slug: 'mca-payments', color: '#16a34a', description: 'Daily/weekly ACH payments from merchants', system: false },
    { team_id: TEAM_ID, name: 'NSF Returns', slug: 'nsf-returns', color: '#dc2626', description: 'Non-sufficient funds / bounced payments', system: false },
    { team_id: TEAM_ID, name: 'Funding Disbursements', slug: 'funding-disbursements', color: '#0ea5e9', description: 'Outgoing funds to merchants', system: false },
    { team_id: TEAM_ID, name: 'ISO Commissions', slug: 'iso-commissions', color: '#f97316', description: 'Broker/ISO commission payments', system: false },
    { team_id: TEAM_ID, name: 'Operating Expenses', slug: 'operating-expenses', color: '#6b7280', description: 'General business expenses', system: false },
  ];

  try {
    await upsert('transaction_categories', categories, { onConflict: 'team_id,slug' });
    console.log('   ✓ 5 MCA categories ensured');
  } catch (e) {
    console.log('   Categories may already exist, continuing...');
  }

  // ------------------------------------------------------------------
  // 5. MCA Payment Income Transactions
  // ------------------------------------------------------------------
  console.log('\n5. Generating MCA payment transactions...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map merchant codes to deal codes
  const codeToDealCode = {
    sunrise:     'MCA-2025-001',
    martinez:    'MCA-2024-001',
    bella:       'MCA-2025-003',
    tonys:       'MCA-2025-004',
    quickprint:  'MCA-2025-005',
    luckydragon: 'MCA-2024-002',
    smith:       'MCA-2024-003',
    greenthumb:  'MCA-2026-001',
    fitness:     'MCA-2026-002',
    westside:    'MCA-2025-006',
  };

  const merchantPayments = [
    { name: 'Sunrise Diner',          amount: 485.00, start: monthsAgo(8),  end: today, code: 'sunrise' },
    { name: 'Martinez Auto Repair',   amount: 320.00, start: monthsAgo(14), end: monthsAgo(4), code: 'martinez' },
    { name: 'Bella Salon & Spa',      amount: 275.00, start: monthsAgo(5),  end: today, code: 'bella' },
    { name: "Tony's Pizzeria",        amount: 380.00, start: monthsAgo(6),  end: today, code: 'tonys' },
    { name: 'Quick Print Solutions',   amount: 425.00, start: monthsAgo(4),  end: today, code: 'quickprint' },
    { name: 'Lucky Dragon Restaurant', amount: 450.00, start: monthsAgo(18), end: monthsAgo(7), code: 'luckydragon' },
    { name: 'Smith Plumbing Services', amount: 350.00, start: monthsAgo(12), end: monthsAgo(3), code: 'smith' },
    { name: 'Green Thumb Landscaping', amount: 295.00, start: daysAgo(14),   end: today, code: 'greenthumb' },
    { name: 'Fitness First Gym',      amount: 510.00, start: daysAgo(7),    end: today, code: 'fitness' },
  ];

  const incomeRows = [];
  for (const mp of merchantPayments) {
    const days = generateBusinessDays(mp.start, mp.end);
    for (const d of days) {
      incomeRows.push({
        id: uuid(),
        team_id: TEAM_ID,
        bank_account_id: BANK_OP_ID,
        date: formatDate(d),
        name: `${mp.name} - ACH Payment`,
        description: `Daily MCA payment - ${mp.name}`,
        amount: mp.amount,
        currency: 'USD',
        category_slug: 'mca-payments',
        status: 'posted',
        method: 'ach',
        deal_code: codeToDealCode[mp.code],
        internal_id: `demo_mca_${mp.code}_${formatDate(d).replace(/-/g, '')}`,
      });
    }
  }

  // Weekly payments for Westside Construction
  const westsideDays = generateWeeklyDays(monthsAgo(7), today);
  for (const d of westsideDays) {
    incomeRows.push({
      id: uuid(),
      team_id: TEAM_ID,
      bank_account_id: BANK_OP_ID,
      date: formatDate(d),
      name: 'Westside Construction LLC - Weekly ACH',
      description: 'Weekly MCA payment - Westside Construction LLC',
      amount: 1890.00,
      currency: 'USD',
      category_slug: 'mca-payments',
      status: 'posted',
      method: 'ach',
      deal_code: codeToDealCode.westside,
      internal_id: `demo_mca_westside_${formatDate(d).replace(/-/g, '')}`,
    });
  }

  console.log(`   Generated ${incomeRows.length} MCA payment transactions`);
  const incomeInserted = await upsert('transactions', incomeRows);
  console.log(`   ✓ ${incomeInserted} income transactions inserted`);

  // ------------------------------------------------------------------
  // 6. NSF Return Transactions
  // ------------------------------------------------------------------
  console.log('\n6. Creating NSF return transactions...');

  const nsfRows = [
    { name: "Tony's Pizzeria - NSF Return",      amount: -380.00,  daysBack: 25, code: 'tonys_1', dealCode: 'MCA-2025-004' },
    { name: "Tony's Pizzeria - NSF Return",      amount: -380.00,  daysBack: 12, code: 'tonys_2', dealCode: 'MCA-2025-004' },
    { name: 'Quick Print Solutions - NSF Return', amount: -425.00,  daysBack: 8,  code: 'quickprint_1', dealCode: 'MCA-2025-005' },
    { name: 'Westside Construction - NSF Return', amount: -1890.00, daysBack: 40, code: 'westside_1', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amount: -1890.00, daysBack: 33, code: 'westside_2', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amount: -1890.00, daysBack: 19, code: 'westside_3', dealCode: 'MCA-2025-006' },
    { name: 'Westside Construction - NSF Return', amount: -1890.00, daysBack: 5,  code: 'westside_4', dealCode: 'MCA-2025-006' },
  ].map(nsf => ({
    id: uuid(),
    team_id: TEAM_ID,
    bank_account_id: BANK_OP_ID,
    date: formatDate(daysAgo(nsf.daysBack)),
    name: nsf.name,
    description: 'Returned ACH - insufficient funds',
    amount: nsf.amount,
    currency: 'USD',
    category_slug: 'nsf-returns',
    deal_code: nsf.dealCode,
    status: 'posted',
    method: 'ach',
    internal_id: `demo_nsf_${nsf.code}`,
  }));

  await upsert('transactions', nsfRows);
  console.log(`   ✓ ${nsfRows.length} NSF transactions inserted`);

  // ------------------------------------------------------------------
  // 7. Funding Disbursement Transactions
  // ------------------------------------------------------------------
  console.log('\n7. Creating funding disbursements...');

  const fundingRows = [
    { name: 'Funding - Lucky Dragon Restaurant',   amount: -75000.00, monthsBack: 18, code: 'luckydragon' },
    { name: 'Funding - Martinez Auto Repair',      amount: -50000.00, monthsBack: 14, code: 'martinez' },
    { name: 'Funding - Smith Plumbing Services',   amount: -50000.00, monthsBack: 12, code: 'smith' },
    { name: 'Funding - Sunrise Diner',             amount: -65000.00, monthsBack: 8,  code: 'sunrise' },
    { name: 'Funding - Westside Construction',     amount: -75000.00, monthsBack: 7,  code: 'westside' },
    { name: "Funding - Tony's Pizzeria",           amount: -60000.00, monthsBack: 6,  code: 'tonys' },
    { name: 'Funding - Bella Salon & Spa',         amount: -45000.00, monthsBack: 5,  code: 'bella' },
    { name: 'Funding - Quick Print Solutions',     amount: -70000.00, monthsBack: 4,  code: 'quickprint' },
    { name: 'Funding - Green Thumb Landscaping',   amount: -40000.00, daysBack: 14,   code: 'greenthumb' },
    { name: 'Funding - Fitness First Gym',         amount: -80000.00, daysBack: 7,    code: 'fitness' },
  ].map(f => ({
    id: uuid(),
    team_id: TEAM_ID,
    bank_account_id: BANK_OP_ID,
    date: formatDate(f.daysBack ? daysAgo(f.daysBack) : monthsAgo(f.monthsBack)),
    name: f.name,
    description: `MCA funding disbursement`,
    amount: f.amount,
    currency: 'USD',
    category_slug: 'funding-disbursements',
    status: 'posted',
    method: 'wire',
    deal_code: codeToDealCode[f.code],
    internal_id: `demo_fund_${f.code}`,
  }));

  await upsert('transactions', fundingRows);
  console.log(`   ✓ ${fundingRows.length} funding transactions inserted ($${Math.abs(fundingRows.reduce((s, r) => s + r.amount, 0)).toLocaleString()} total)`);

  // ------------------------------------------------------------------
  // 8. ISO Commission Transactions
  // ------------------------------------------------------------------
  console.log('\n8. Creating ISO commission payments...');

  const isoRows = [
    { name: 'ISO Commission - Pinnacle Funding Group',       amount: -7500.00, monthsBack: 18, code: 'luckydragon' },
    { name: 'ISO Commission - Capital Brokers LLC',          amount: -5000.00, monthsBack: 14, code: 'martinez' },
    { name: 'ISO Commission - Southwest Funding Partners',   amount: -5500.00, monthsBack: 12, code: 'smith' },
    { name: 'ISO Commission - Pinnacle Funding Group',       amount: -6500.00, monthsBack: 8,  code: 'sunrise' },
    { name: 'ISO Commission - Capital Brokers LLC',          amount: -8250.00, monthsBack: 7,  code: 'westside' },
    { name: 'ISO Commission - Southwest Funding Partners',   amount: -6600.00, monthsBack: 6,  code: 'tonys' },
    { name: 'ISO Commission - Pinnacle Funding Group',       amount: -4950.00, monthsBack: 5,  code: 'bella' },
    { name: 'ISO Commission - Capital Brokers LLC',          amount: -7700.00, monthsBack: 4,  code: 'quickprint' },
    { name: 'ISO Commission - Southwest Funding Partners',   amount: -4400.00, daysBack: 14,   code: 'greenthumb' },
    { name: 'ISO Commission - Pinnacle Funding Group',       amount: -8800.00, daysBack: 7,    code: 'fitness' },
  ].map(iso => ({
    id: uuid(),
    team_id: TEAM_ID,
    bank_account_id: BANK_OP_ID,
    date: formatDate(iso.daysBack ? daysAgo(iso.daysBack) : monthsAgo(iso.monthsBack)),
    name: iso.name,
    description: `Broker commission payment`,
    amount: iso.amount,
    currency: 'USD',
    category_slug: 'iso-commissions',
    status: 'posted',
    method: 'ach',
    deal_code: codeToDealCode[iso.code],
    internal_id: `demo_iso_${iso.code}`,
  }));

  await upsert('transactions', isoRows);
  console.log(`   ✓ ${isoRows.length} ISO commission transactions inserted`);

  // ------------------------------------------------------------------
  // 9. Monthly Operating Expenses
  // ------------------------------------------------------------------
  console.log('\n9. Generating monthly operating expenses...');

  const opExpenses = [
    { name: 'Office Lease - 500 Commerce St',  amount: -3500.00, method: 'payment',       code: 'rent',      day: 1 },
    { name: 'Gusto Payroll',                   amount: -12000.00, method: 'ach',           code: 'payroll',   day: 15 },
    { name: 'Mercury - Software Stack',        amount: -850.00,   method: 'card_purchase', code: 'software',  day: 5 },
    { name: 'Thompson & Associates',           amount: -1200.00,  method: 'ach',           code: 'legal',     day: 10 },
    { name: 'State Farm Insurance',            amount: -600.00,   method: 'ach',           code: 'insurance', day: 8 },
    { name: 'AT&T Business',                   amount: -350.00,   method: 'ach',           code: 'telecom',   day: 12 },
    { name: 'Office Depot',                    amount: -175.00,   method: 'card_purchase', code: 'supplies',  day: 20 },
  ];

  const opexRows = [];
  for (const exp of opExpenses) {
    const dates = monthlyDates(12, exp.day);
    for (const d of dates) {
      opexRows.push({
        id: uuid(),
        team_id: TEAM_ID,
        bank_account_id: BANK_OP_ID,
        date: formatDate(d),
        name: exp.name,
        description: exp.name,
        amount: exp.amount,
        currency: 'USD',
        category_slug: 'operating-expenses',
        status: 'posted',
        method: exp.method,
        internal_id: `demo_opex_${exp.code}_${formatDate(d).replace(/-/g, '').slice(0, 6)}`,
      });
    }
  }

  await upsert('transactions', opexRows);
  console.log(`   ✓ ${opexRows.length} operating expense transactions inserted`);

  // ------------------------------------------------------------------
  // 10. Invoice Template
  // ------------------------------------------------------------------
  console.log('\n10. Creating invoice template...');

  const templateId = uuid();
  try {
    await upsert('invoice_templates', [{
      id: templateId,
      team_id: TEAM_ID,
      name: 'Default',
      is_default: true,
      currency: 'USD',
      size: 'letter',
    }]);
    console.log('   ✓ Invoice template created');
  } catch (e) {
    console.log('   Template may already exist, continuing...');
  }

  // Fetch the template to get the actual ID
  const templates = await fetchAll('invoice_templates', `team_id=eq.${TEAM_ID}&is_default=eq.true&limit=1`);
  const tplId = templates.length ? templates[0].id : templateId;

  // ------------------------------------------------------------------
  // 11. Invoices
  // ------------------------------------------------------------------
  console.log('\n11. Creating invoices...');

  const invoiceRows = [
    // PAID: Historical fundings
    { num: 'INV-2024-001', status: 'paid', customer: 'Lucky Dragon Restaurant', amount: 75000, issued: monthsAgo(18), due: monthsAgo(17), item: 'MCA Funding - MCA-2024-002' },
    { num: 'INV-2024-002', status: 'paid', customer: 'Martinez Auto Repair', amount: 50000, issued: monthsAgo(14), due: monthsAgo(13), item: 'MCA Funding - MCA-2024-001' },
    { num: 'INV-2024-003', status: 'paid', customer: 'Smith Plumbing Services', amount: 50000, issued: monthsAgo(12), due: monthsAgo(11), item: 'MCA Funding - MCA-2024-003' },
    { num: 'INV-2025-001', status: 'paid', customer: 'Sunrise Diner', amount: 65000, issued: monthsAgo(8), due: monthsAgo(7), item: 'MCA Funding - MCA-2025-001' },
    { num: 'INV-2025-002', status: 'paid', customer: 'Westside Construction LLC', amount: 75000, issued: monthsAgo(7), due: monthsAgo(6), item: 'MCA Funding - MCA-2025-006' },
    { num: 'INV-2025-003', status: 'paid', customer: "Tony's Pizzeria", amount: 60000, issued: monthsAgo(6), due: monthsAgo(5), item: 'MCA Funding - MCA-2025-004' },
    { num: 'INV-2025-004', status: 'paid', customer: 'Bella Salon & Spa', amount: 45000, issued: monthsAgo(5), due: monthsAgo(4), item: 'MCA Funding - MCA-2025-003' },
    { num: 'INV-2025-005', status: 'paid', customer: 'Quick Print Solutions', amount: 70000, issued: monthsAgo(4), due: monthsAgo(3), item: 'MCA Funding - MCA-2025-005' },

    // UNPAID: Recent fundings
    { num: 'INV-2026-001', status: 'unpaid', customer: 'Green Thumb Landscaping', amount: 40000, issued: daysAgo(14), due: addDays(new Date(), 16), item: 'MCA Funding - MCA-2026-001' },
    { num: 'INV-2026-002', status: 'unpaid', customer: 'Fitness First Gym', amount: 80000, issued: daysAgo(7), due: addDays(new Date(), 23), item: 'MCA Funding - MCA-2026-002' },

    // OVERDUE
    { num: 'INV-2025-006', status: 'overdue', customer: 'Westside Construction LLC', amount: 2500, issued: monthsAgo(2), due: monthsAgo(1), item: 'Legal fees - Collections review' },

    // DRAFT: Renewal offers
    { num: 'INV-2026-003', status: 'draft', customer: 'Lucky Dragon Restaurant', amount: 100000, issued: new Date(), due: addDays(new Date(), 30), item: 'MCA Renewal Offer - Up to $100,000' },
    { num: 'INV-2026-004', status: 'draft', customer: 'Smith Plumbing Services', amount: 75000, issued: new Date(), due: addDays(new Date(), 30), item: 'MCA Renewal Offer - Up to $75,000' },
  ].map(inv => ({
    id: uuid(),
    team_id: TEAM_ID,
    customer_id: cx[inv.customer],
    user_id: userId,
    template_id: tplId,
    invoice_number: inv.num,
    status: inv.status,
    issue_date: inv.issued.toISOString(),
    due_date: inv.due.toISOString(),
    amount: inv.amount,
    subtotal: inv.amount,
    currency: 'USD',
    customer_name: inv.customer,
    line_items: [{ name: inv.item, quantity: 1, price: inv.amount }],
    token: `tok_${inv.num.toLowerCase().replace(/-/g, '_')}`,
  }));

  await upsert('invoices', invoiceRows);
  console.log(`   ✓ ${invoiceRows.length} invoices created (8 paid, 2 unpaid, 1 overdue, 2 draft)`);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  const totalTxns = incomeRows.length + nsfRows.length + fundingRows.length + isoRows.length + opexRows.length;
  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalExpense = [...nsfRows, ...fundingRows, ...isoRows, ...opexRows].reduce((s, r) => s + r.amount, 0);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo data seeded successfully!\n');
  console.log(`   Transactions:  ${totalTxns.toLocaleString()}`);
  console.log(`   Total Income:  $${totalIncome.toLocaleString()}`);
  console.log(`   Total Expense: -$${Math.abs(totalExpense).toLocaleString()}`);
  console.log(`   Net:           $${(totalIncome + totalExpense).toLocaleString()}`);
  console.log(`   Invoices:      ${invoiceRows.length}`);
  console.log(`   Tags:          ${tagNames.length}`);
  console.log(`   Bank Accounts: 2 ($${(847592.45 + 250000).toLocaleString()} total)`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
