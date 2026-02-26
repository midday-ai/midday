#!/usr/bin/env bash
# =============================================================================
# Abacus Demo Seed Runner
# =============================================================================
# Prerequisites:
#   1. supabase db reset  (applies all migrations)
#   2. Create auth user via signup:
#      curl -X POST 'http://localhost:54321/auth/v1/signup' \
#        -H "apikey: $(npx supabase status | grep 'anon key' | awk '{print $NF}')" \
#        -H "Content-Type: application/json" \
#        -d '{"email":"suph.tweel@gmail.com","password":"demo123"}'
#
# Usage:
#   bash scripts/seed-all.sh
# =============================================================================

set -euo pipefail

DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PSQL="psql $DB_URL -v ON_ERROR_STOP=1"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "=== Abacus Demo Seed: Starting ==="
echo ""

# Step 1: Base data (users, teams, bank accounts, merchants, deals, transactions, payments, invoices)
echo "[1/6] Running seed-local.mjs (JS-based base seed)..."
node "$SCRIPT_DIR/seed-local.mjs"
echo "  Done."
echo ""

# Step 2: MCA features (underwriting, deal bank accounts, deal fees, disclosures,
#          transaction rules, export templates, ACH batches, reconciliation sessions,
#          merchant documents, messages, notifications, payoff requests, match audit log)
echo "[2/6] Running seed-mca-features.sql..."
$PSQL -f "$SCRIPT_DIR/seed-mca-features.sql"
echo "  Done."
echo ""

# Step 3: Brokers, syndicators, broker commissions, syndication participants
echo "[3/6] Running seed-brokers-syndicators-v2.sql..."
$PSQL -f "$SCRIPT_DIR/seed-brokers-syndicators-v2.sql"
echo "  Done."
echo ""

# Step 4: Diverse MCA scenarios (NSF storm, early payoff, seasonal slowdown, etc.)
echo "[4/6] Running seed-diverse-scenarios.sql..."
$PSQL -f "$SCRIPT_DIR/seed-diverse-scenarios.sql"
echo "  Done."
echo ""

# Step 5: Portal sessions/invites/access, config tables, vault docs, inbox, deal column backfills
echo "[5/6] Running seed-portal-and-config.sql..."
$PSQL -f "$SCRIPT_DIR/seed-portal-and-config.sql"
echo "  Done."
echo ""

# Step 6: Risk scoring seed data (8 merchant archetypes with payment histories)
echo "[6/6] Running seed-risk-data.sql..."
$PSQL -f "$SCRIPT_DIR/seed-risk-data.sql"
echo "  Done."
echo ""

echo "=== Abacus Demo Seed: Complete ==="
echo ""
echo "Quick verify:"
$PSQL -c "
SELECT 'merchants' AS table_name, count(*) AS rows FROM merchants WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'mca_deals', count(*) FROM mca_deals WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'transactions', count(*) FROM transactions WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'brokers', count(*) FROM brokers WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'syndicators', count(*) FROM syndicators WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'late_fee_settings', count(*) FROM late_fee_settings WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'ach_providers', count(*) FROM ach_providers WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'portal_invites', count(*) FROM merchant_portal_invites WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'vault_documents', count(*) FROM documents WHERE team_id='a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'inbox', count(*) FROM inbox WHERE team_id='a0000000-0000-0000-0000-000000000001'
ORDER BY 1;
"
