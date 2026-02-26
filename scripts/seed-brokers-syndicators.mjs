#!/usr/bin/env node
/**
 * Seed broker and syndication demo data for Abacus dashboard via Supabase REST API.
 *
 * Usage: node scripts/seed-brokers-syndicators.mjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY env var');
  process.exit(1);
}

const TEAM_ID = 'a0000000-0000-0000-0000-000000000001';

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates',
};

function uuid() { return crypto.randomUUID(); }

async function upsert(table, rows, options = {}) {
  const h = { ...headers };
  const queryParams = options.onConflict ? `?on_conflict=${options.onConflict}` : '';
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${queryParams}`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.code === '23505') { console.log(`  (skipping duplicates)`); return; }
    throw new Error(`${table} insert failed: ${err.message} (${err.code})`);
  }
}

async function fetchAll(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch ${table}`);
  return res.json();
}

async function patch(table, query, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`${table} patch failed: ${err.message}`);
  }
}

// ============================================================================
// Main
// ============================================================================

function monthsAgo(n) {
  const d = new Date(); d.setMonth(d.getMonth() - n); d.setHours(0,0,0,0); return d;
}
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(0,0,0,0); return d;
}

async function main() {
  console.log('Seeding MCA deals + broker & syndication demo data...\n');

  // ------------------------------------------------------------------
  // 1. Check for existing brokers
  // ------------------------------------------------------------------
  const existingBrokers = await fetchAll('brokers', `team_id=eq.${TEAM_ID}&limit=1`);
  if (existingBrokers.length > 0) {
    console.log('Brokers already exist. Skipping to avoid duplicates.');
    console.log('To re-seed, delete from brokers/syndicators first.');
    process.exit(0);
  }

  // ------------------------------------------------------------------
  // 2. Create MCA deals if they don't exist
  // ------------------------------------------------------------------
  console.log('1. Checking MCA deals...');
  let deals = await fetchAll('mca_deals', `team_id=eq.${TEAM_ID}&order=deal_code`);

  if (!deals.length) {
    console.log('   No deals found — creating MCA deals...');

    // Look up customers
    const customers = await fetchAll('customers', `team_id=eq.${TEAM_ID}&order=name`);
    const cx = {};
    for (const c of customers) cx[c.name] = c.id;

    if (!cx['Sunrise Diner']) {
      console.error('   Customers not found. Run the base seed first.');
      process.exit(1);
    }

    const dealRows = [
      { customer: 'Sunrise Diner',            code: 'MCA-2025-001', fund: 65000, rate: 1.3500, payback: 87750,  daily: 485,  freq: 'daily',  status: 'active',   funded: monthsAgo(8),  balance: 5300,   paid: 82450,  nsf: 0 },
      { customer: 'Bella Salon & Spa',        code: 'MCA-2025-003', fund: 45000, rate: 1.3800, payback: 62100,  daily: 275,  freq: 'daily',  status: 'active',   funded: monthsAgo(5),  balance: 31850,  paid: 30250,  nsf: 0 },
      { customer: "Tony's Pizzeria",          code: 'MCA-2025-004', fund: 60000, rate: 1.4200, payback: 85200,  daily: 380,  freq: 'daily',  status: 'late',     funded: monthsAgo(6),  balance: 37800,  paid: 47400,  nsf: 2 },
      { customer: 'Quick Print Solutions',     code: 'MCA-2025-005', fund: 70000, rate: 1.4000, payback: 98000,  daily: 425,  freq: 'daily',  status: 'active',   funded: monthsAgo(4),  balance: 61875,  paid: 36125,  nsf: 1 },
      { customer: 'Westside Construction LLC', code: 'MCA-2025-006', fund: 75000, rate: 1.4500, payback: 108750, daily: 1890, freq: 'weekly', status: 'late',     funded: monthsAgo(7),  balance: 55050,  paid: 53700,  nsf: 4 },
      { customer: 'Green Thumb Landscaping',   code: 'MCA-2026-001', fund: 40000, rate: 1.3600, payback: 54400,  daily: 295,  freq: 'daily',  status: 'active',   funded: daysAgo(14),   balance: 51450,  paid: 2950,   nsf: 0 },
      { customer: 'Fitness First Gym',        code: 'MCA-2026-002', fund: 80000, rate: 1.3400, payback: 107200, daily: 510,  freq: 'daily',  status: 'active',   funded: daysAgo(7),    balance: 104650, paid: 2550,   nsf: 0 },
      { customer: 'Martinez Auto Repair',     code: 'MCA-2024-001', fund: 50000, rate: 1.3200, payback: 66000,  daily: 320,  freq: 'daily',  status: 'paid_off', funded: monthsAgo(14), balance: 0,      paid: 66000,  nsf: 0 },
      { customer: 'Lucky Dragon Restaurant',  code: 'MCA-2024-002', fund: 75000, rate: 1.3500, payback: 101250, daily: 450,  freq: 'daily',  status: 'paid_off', funded: monthsAgo(18), balance: 0,      paid: 101250, nsf: 0 },
      { customer: 'Smith Plumbing Services',  code: 'MCA-2024-003', fund: 50000, rate: 1.3300, payback: 66500,  daily: 350,  freq: 'daily',  status: 'paid_off', funded: monthsAgo(12), balance: 0,      paid: 66500,  nsf: 0 },
    ].map(d => ({
      id: uuid(),
      team_id: TEAM_ID,
      customer_id: cx[d.customer],
      deal_code: d.code,
      funding_amount: d.fund,
      factor_rate: d.rate,
      payback_amount: d.payback,
      daily_payment: d.daily,
      payment_frequency: d.freq,
      status: d.status,
      funded_at: d.funded.toISOString(),
      current_balance: d.balance,
      total_paid: d.paid,
      nsf_count: d.nsf,
    }));

    await upsert('mca_deals', dealRows, { onConflict: 'team_id,deal_code' });
    console.log(`   ${dealRows.length} MCA deals created`);

    // Re-fetch to get IDs
    deals = await fetchAll('mca_deals', `team_id=eq.${TEAM_ID}&order=deal_code`);
  } else {
    console.log(`   Found ${deals.length} existing deals`);
  }

  const dealMap = {};
  for (const d of deals) dealMap[d.deal_code] = d;
  console.log(`   ${Object.keys(dealMap).length} deals ready`);

  // ------------------------------------------------------------------
  // 3. Create Brokers (ISOs)
  // ------------------------------------------------------------------
  console.log('\n2. Creating brokers...');

  const brokerIds = {
    pinnacle: uuid(),
    capital: uuid(),
    southwest: uuid(),
  };

  const brokers = [
    {
      id: brokerIds.pinnacle,
      team_id: TEAM_ID,
      name: 'David Chen',
      email: 'david.chen@pinnaclefunding.com',
      phone: '(212) 555-0147',
      company_name: 'Pinnacle Funding Group',
      website: 'https://pinnaclefunding.com',
      address_line_1: '350 Fifth Avenue, Suite 4200',
      city: 'New York',
      state: 'NY',
      zip: '10118',
      country: 'US',
      commission_percentage: 10.00,
      status: 'active',
      note: 'Top-performing ISO. Specializes in restaurant and hospitality deals. Consistent high-quality deal flow.',
    },
    {
      id: brokerIds.capital,
      team_id: TEAM_ID,
      name: 'Marcus Williams',
      email: 'marcus@capitalbrokers.com',
      phone: '(305) 555-0233',
      company_name: 'Capital Brokers LLC',
      website: 'https://capitalbrokers.co',
      address_line_1: '1200 Brickell Ave, Suite 800',
      city: 'Miami',
      state: 'FL',
      zip: '33131',
      country: 'US',
      commission_percentage: 11.00,
      status: 'active',
      note: 'Strong in construction and trades verticals. Growing deal volume.',
    },
    {
      id: brokerIds.southwest,
      team_id: TEAM_ID,
      name: 'Sarah Rodriguez',
      email: 'sarah@southwestfunding.com',
      phone: '(602) 555-0189',
      company_name: 'Southwest Funding Partners',
      website: 'https://southwestfunding.com',
      address_line_1: '2901 N Central Ave, Suite 1500',
      city: 'Phoenix',
      state: 'AZ',
      zip: '85012',
      country: 'US',
      commission_percentage: 11.00,
      status: 'active',
      note: 'Regional ISO covering AZ, NM, NV. Good at service industry deals.',
    },
  ];

  await upsert('brokers', brokers);
  console.log('   3 brokers created');

  // ------------------------------------------------------------------
  // 4. Link deals to brokers via broker_id on mca_deals
  // ------------------------------------------------------------------
  console.log('\n3. Linking deals to brokers...');

  const dealBrokerMap = {
    'MCA-2024-001': brokerIds.capital,     // Martinez Auto
    'MCA-2024-002': brokerIds.pinnacle,    // Lucky Dragon
    'MCA-2024-003': brokerIds.southwest,   // Smith Plumbing
    'MCA-2025-001': brokerIds.pinnacle,    // Sunrise Diner
    'MCA-2025-003': brokerIds.pinnacle,    // Bella Salon
    'MCA-2025-004': brokerIds.southwest,   // Tony's Pizzeria
    'MCA-2025-005': brokerIds.capital,     // Quick Print
    'MCA-2025-006': brokerIds.capital,     // Westside Construction
    'MCA-2026-001': brokerIds.southwest,   // Green Thumb
    'MCA-2026-002': brokerIds.pinnacle,    // Fitness First
  };

  for (const [dealCode, brokerId] of Object.entries(dealBrokerMap)) {
    const deal = dealMap[dealCode];
    if (deal) {
      await patch('mca_deals', `id=eq.${deal.id}`, { broker_id: brokerId });
    }
  }
  console.log('   10 deals linked to brokers');

  // ------------------------------------------------------------------
  // 5. Create Broker Commissions
  // ------------------------------------------------------------------
  console.log('\n4. Creating broker commissions...');

  const commissions = [];
  for (const [dealCode, brokerId] of Object.entries(dealBrokerMap)) {
    const deal = dealMap[dealCode];
    if (!deal) continue;

    const broker = brokers.find(b => b.id === brokerId);
    const pct = broker.commission_percentage;
    const amount = deal.funding_amount * (pct / 100);
    const isPaid = ['paid_off', 'active', 'late'].includes(deal.status);

    commissions.push({
      id: uuid(),
      deal_id: deal.id,
      broker_id: brokerId,
      team_id: TEAM_ID,
      commission_percentage: pct,
      commission_amount: amount,
      status: isPaid ? 'paid' : 'pending',
      paid_at: isPaid ? deal.funded_at : null,
      note: `Commission on ${dealCode} (${pct}% of $${deal.funding_amount.toLocaleString()})`,
    });
  }

  await upsert('broker_commissions', commissions, { onConflict: 'deal_id,broker_id' });
  console.log(`   ${commissions.length} commissions created`);
  const totalCommissions = commissions.reduce((s, c) => s + c.commission_amount, 0);
  console.log(`   Total commission value: $${totalCommissions.toLocaleString()}`);

  // ------------------------------------------------------------------
  // 6. Create Syndicators
  // ------------------------------------------------------------------
  console.log('\n5. Creating syndicators...');

  const syndicatorIds = {
    apex: uuid(),
    harbor: uuid(),
    meridian: uuid(),
  };

  const syndicators = [
    {
      id: syndicatorIds.apex,
      team_id: TEAM_ID,
      name: 'Apex Capital Partners',
      email: 'investments@apexcapitalpartners.com',
      phone: '(312) 555-0412',
      company_name: 'Apex Capital Partners LLC',
      website: 'https://apexcapitalpartners.com',
      address_line_1: '233 S Wacker Dr, Suite 5000',
      city: 'Chicago',
      state: 'IL',
      zip: '60606',
      country: 'US',
      status: 'active',
      note: 'Institutional syndication partner. Prefers larger deals ($50K+). Quick funding decisions.',
    },
    {
      id: syndicatorIds.harbor,
      team_id: TEAM_ID,
      name: 'Harbor Funding Group',
      email: 'syndications@harborfunding.com',
      phone: '(617) 555-0298',
      company_name: 'Harbor Funding Group Inc',
      website: 'https://harborfunding.com',
      address_line_1: '100 Federal St, Suite 2800',
      city: 'Boston',
      state: 'MA',
      zip: '02110',
      country: 'US',
      status: 'active',
      note: 'Conservative syndication partner. Focuses on low-risk deals with strong merchants. Max 30% participation.',
    },
    {
      id: syndicatorIds.meridian,
      team_id: TEAM_ID,
      name: 'Meridian Investors',
      email: 'deals@meridianinvestors.com',
      phone: '(415) 555-0573',
      company_name: 'Meridian Investors Group',
      website: 'https://meridianinvestors.com',
      address_line_1: '101 California St, Suite 3200',
      city: 'San Francisco',
      state: 'CA',
      zip: '94111',
      country: 'US',
      status: 'active',
      note: 'Flexible syndication partner. Willing to take higher-risk deals for better returns. Fast decision maker.',
    },
  ];

  await upsert('syndicators', syndicators);
  console.log('   3 syndicators created');

  // ------------------------------------------------------------------
  // 7. Create Syndication Participants
  // ------------------------------------------------------------------
  console.log('\n6. Creating syndication participations...');

  // Syndicate some of the larger/active deals
  const participations = [
    // Westside Construction ($75K) — syndicated 50%: Apex 30%, Meridian 20%
    {
      deal_code: 'MCA-2025-006',
      syndicator_id: syndicatorIds.apex,
      funding_share: 22500.00,
      ownership_percentage: 0.3000,
      status: 'active',
      note: 'Took 30% on Westside deal. Aware of NSF history.',
    },
    {
      deal_code: 'MCA-2025-006',
      syndicator_id: syndicatorIds.meridian,
      funding_share: 15000.00,
      ownership_percentage: 0.2000,
      status: 'active',
      note: 'Took 20% on Westside despite risk profile.',
    },

    // Quick Print ($70K) — syndicated 40%: Harbor 25%, Apex 15%
    {
      deal_code: 'MCA-2025-005',
      syndicator_id: syndicatorIds.harbor,
      funding_share: 17500.00,
      ownership_percentage: 0.2500,
      status: 'active',
      note: 'Harbor took conservative 25% position.',
    },
    {
      deal_code: 'MCA-2025-005',
      syndicator_id: syndicatorIds.apex,
      funding_share: 10500.00,
      ownership_percentage: 0.1500,
      status: 'active',
      note: 'Smaller position alongside Harbor.',
    },

    // Fitness First ($80K) — syndicated 35%: Apex 20%, Harbor 15%
    {
      deal_code: 'MCA-2026-002',
      syndicator_id: syndicatorIds.apex,
      funding_share: 16000.00,
      ownership_percentage: 0.2000,
      status: 'active',
      note: 'New deal — Apex took 20% on Fitness First.',
    },
    {
      deal_code: 'MCA-2026-002',
      syndicator_id: syndicatorIds.harbor,
      funding_share: 12000.00,
      ownership_percentage: 0.1500,
      status: 'active',
      note: 'Harbor took 15% on gym vertical.',
    },

    // Lucky Dragon ($75K, paid off) — was syndicated 25%: Meridian
    {
      deal_code: 'MCA-2024-002',
      syndicator_id: syndicatorIds.meridian,
      funding_share: 18750.00,
      ownership_percentage: 0.2500,
      status: 'active',
      note: 'Deal fully paid off. Meridian earned solid return.',
    },

    // Sunrise Diner ($65K) — syndicated 20%: Harbor
    {
      deal_code: 'MCA-2025-001',
      syndicator_id: syndicatorIds.harbor,
      funding_share: 13000.00,
      ownership_percentage: 0.2000,
      status: 'active',
      note: 'Low-risk diner — strong payment history.',
    },

    // Martinez ($50K, paid off) — was syndicated 30%: Apex
    {
      deal_code: 'MCA-2024-001',
      syndicator_id: syndicatorIds.apex,
      funding_share: 15000.00,
      ownership_percentage: 0.3000,
      status: 'active',
      note: 'Fully paid off. Good experience with this merchant.',
    },
  ];

  const participantRows = participations.map(p => {
    const deal = dealMap[p.deal_code];
    return {
      id: uuid(),
      deal_id: deal.id,
      syndicator_id: p.syndicator_id,
      team_id: TEAM_ID,
      funding_share: p.funding_share,
      ownership_percentage: p.ownership_percentage,
      status: p.status,
      note: p.note,
    };
  });

  await upsert('syndication_participants', participantRows, { onConflict: 'deal_id,syndicator_id' });
  console.log(`   ${participantRows.length} participations created across ${new Set(participations.map(p => p.deal_code)).size} deals`);

  const totalSyndicated = participantRows.reduce((s, p) => s + p.funding_share, 0);
  console.log(`   Total syndicated funding: $${totalSyndicated.toLocaleString()}`);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('\n' + '='.repeat(55));
  console.log('Done! Broker & syndication data seeded.\n');
  console.log('   Brokers:');
  console.log('     - Pinnacle Funding Group (David Chen) — 4 deals');
  console.log('     - Capital Brokers LLC (Marcus Williams) — 3 deals');
  console.log('     - Southwest Funding Partners (Sarah Rodriguez) — 3 deals');
  console.log(`     - Total commissions: $${totalCommissions.toLocaleString()}`);
  console.log('');
  console.log('   Syndicators:');
  console.log('     - Apex Capital Partners — 4 deals, $64K syndicated');
  console.log('     - Harbor Funding Group — 3 deals, $42.5K syndicated');
  console.log('     - Meridian Investors — 2 deals, $33.75K syndicated');
  console.log(`     - Total syndicated: $${totalSyndicated.toLocaleString()}`);
  console.log('='.repeat(55));
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
