/**
 * Linear Import Script
 * Imports Abacus roadmap into Linear as projects and issues
 *
 * Usage: LINEAR_API_KEY=lin_api_xxx bun scripts/linear-import.ts
 */

const LINEAR_API_URL = "https://api.linear.app/graphql";

// Get API key from environment
const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error("ERROR: LINEAR_API_KEY environment variable required");
  console.error("Usage: LINEAR_API_KEY=lin_api_xxx bun scripts/linear-import.ts");
  process.exit(1);
}

// GraphQL helper
async function linearQuery(query: string, variables?: Record<string, unknown>) {
  const response = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY!,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  if (result.errors) {
    // Don't log duplicate errors - they're handled gracefully
    const isDuplicateError = result.errors[0].message.includes("not unique") ||
                             result.errors[0].message.includes("already exists");
    if (!isDuplicateError) {
      console.error("GraphQL Error:", JSON.stringify(result.errors, null, 2));
    }
    throw new Error(result.errors[0].message);
  }
  return result.data;
}

// ============================================================================
// DATA DEFINITIONS
// ============================================================================

interface Project {
  name: string;
  description: string;
  color: string;
  targetDate?: string;
  labels?: string[];
}

const PROJECTS: Project[] = [
  {
    name: "Phase 0: Foundation",
    description: "Authentication & Onboarding (Week 0-0.5). Login/signup with Google OAuth, team creation, Stripe payments, 14-day trial. Exit: User completes full flow to dashboard.",
    color: "#6366f1",
    targetDate: "2026-02-08",
    labels: ["Feature-Parity", "Net-New"]
  },
  {
    name: "Phase 1: Data Foundation",
    description: "Google Sheets Sync (Weeks 1-4). OAuth connection, AI column mapping, deal/payment sync, ledger calculations, NSF logic. Exit: Honest Funding + Emmy Capital live.",
    color: "#8b5cf6",
    targetDate: "2026-03-08",
    labels: ["Feature-Parity"]
  },
  {
    name: "Phase 2: Admin Experience",
    description: "Portfolio Dashboard (Weeks 5-8). Summary cards, deals table, deal detail, payment timeline, onboarding wizard. Exit: Operators see entire portfolio at a glance.",
    color: "#a855f7",
    targetDate: "2026-04-05",
    labels: ["Feature-Parity"]
  },
  {
    name: "Phase 3: Collections",
    description: "Collections Workflow (Weeks 9-12). At-risk deals, risk levels, assignees, notes drawer, follow-ups. Exit: Collections workflow daily-drivable.",
    color: "#d946ef",
    targetDate: "2026-05-03",
    labels: ["Feature-Parity"]
  },
  {
    name: "Phase 4: Letters",
    description: "Document Generation (Weeks 13-14). Payoff letters, zero balance, renewal letters via React-PDF. Merchant portal letter requests. Exit: Generate letters in <5 seconds.",
    color: "#ec4899",
    targetDate: "2026-05-17",
    labels: ["Feature-Parity"]
  },
  {
    name: "Phase 5: Access Control",
    description: "RBAC & Namespace Migration (Weeks 15-16). Admin/Rep/Merchant roles. @midday → @abacus rename (956 files). Exit: Build passes with all @abacus/* imports.",
    color: "#f43f5e",
    targetDate: "2026-05-31",
    labels: ["Feature-Parity", "Migration"]
  },
  {
    name: "Phase 6: Alerts",
    description: "Push Notifications (Weeks 17-18). NSF/late payment alerts, weekly summary email, AI insights. \"Push, don't pull\" - we tell you before you ask.",
    color: "#f97316",
    targetDate: "2026-06-14",
    labels: ["Net-New"]
  },
  {
    name: "Phase 7: Launch",
    description: "Production Launch (Weeks 19-20). Performance (<2s load), billing enforcement, security audit, help docs. PUBLIC LAUNCH: July 1, 2026.",
    color: "#eab308",
    targetDate: "2026-07-01",
    labels: ["Net-New", "Migration"]
  },
  {
    name: "Support & Feedback",
    description: "Customer support tickets, bug reports, and feedback intake",
    color: "#22c55e",
    labels: []
  },
  {
    name: "Future: Post-Launch",
    description: "Backlog for features after 20-week roadmap (Plaid, custom domains, API access, predictive risk scoring, etc.)",
    color: "#64748b",
    labels: ["Net-New"]
  },
];

const LABELS = [
  // Issue type labels
  { name: "Feature", color: "#3b82f6" },
  { name: "Database", color: "#8b5cf6" },
  { name: "Refactor", color: "#f59e0b" },
  { name: "Testing", color: "#10b981" },
  { name: "Security", color: "#ef4444" },
  { name: "Performance", color: "#06b6d4" },
  { name: "Documentation", color: "#64748b" },
  { name: "Bug", color: "#dc2626" },
  { name: "Support", color: "#22c55e" },
  { name: "Feedback", color: "#0ea5e9" },
  { name: "P0-Critical", color: "#ef4444" },
  { name: "P1-High", color: "#f97316" },
  { name: "P2-Medium", color: "#eab308" },

  // Work type labels (for projects)
  { name: "Migration", color: "#8b5cf6" },      // Purple - Midday.ai infra → Abacus (Fly.io, @midday/* → @abacus/*)
  { name: "Feature-Parity", color: "#3b82f6" }, // Blue - Honest Funding features → Abacus (sync.ts, collections)
  { name: "Net-New", color: "#10b981" },        // Green - Unique Abacus features (AI, push notifications, SaaS billing)
];

interface Issue {
  title: string;
  description?: string;
  project: string;
  labels?: string[];
  priority?: number; // 1=Urgent, 2=High, 3=Normal, 4=Low
}

const ISSUES: Issue[] = [
  // ========== PHASE 0: FOUNDATION ==========
  { title: "Create login page with Google OAuth + email/password", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Create sign up page for new user registration", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement 'No account found' interstitial for new Google users", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Create forgot password page with email-based reset", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Create team creation page (company name, country, currency)", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Build dashboard welcome modal for onboarding start", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Create welcome/value prop page with trial benefits", project: "Phase 0: Foundation", labels: ["Feature"], priority: 2 },
  { title: "Build plan selection page with pricing display", project: "Phase 0: Foundation", labels: ["Feature"], priority: 2 },
  { title: "Integrate Stripe payment form with promo codes", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement trial logic (14-day trial, charge after)", project: "Phase 0: Foundation", labels: ["Feature"], priority: 1 },

  // ========== PHASE 1: DATA FOUNDATION ==========
  { title: "Set up Google Sheets OAuth flow in dashboard settings", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Create sheet_connections table migration", project: "Phase 1: Data Foundation", labels: ["Database"], priority: 1 },
  { title: "Build sheet URL input and validation component", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement sheet metadata fetching (columns, row count)", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Build column mapping configuration UI", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement AI-suggested column mapping with Claude", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Build AI spreadsheet logic analysis (formulas, fee structures)", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement initial sync: MainSheet → mca_deals table", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Add sync status indicator in header", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 2 },
  { title: "Sync PMT sheet → mca_payments table", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Implement ledger balance calculation (running balance)", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Add NSF fee logic ($35 per failed payment)", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 1 },
  { title: "Calculate paid percentage for each deal", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 2 },
  { title: "Implement sync lock mechanism (prevent concurrent syncs)", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 2 },
  { title: "Add payment-only fast sync option", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 3 },
  { title: "Create email notification on sync failure", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 2 },
  { title: "Add manual sync trigger button", project: "Phase 1: Data Foundation", labels: ["Feature"], priority: 2 },

  // ========== PHASE 2: ADMIN EXPERIENCE ==========
  { title: "Create admin dashboard route (/portfolio/)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Build summary cards (total funded, outstanding, repaid %)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Add at-risk count indicator to dashboard", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Update navigation menu for admin routes", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 2 },
  { title: "Create MCA deals table with sorting/filtering", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Implement search by merchant name and deal code", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Add status filters (active, paid off, defaulted)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Add basic risk indicators (NSF count badge)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 2 },
  { title: "Create deal detail page (/portfolio/[dealId])", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Build payment history timeline on deal detail", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Implement days past due calculation", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Add merchant impersonation button (View as Merchant)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 2 },
  { title: "Create first-time setup wizard (connect → map → sync)", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 1 },
  { title: "Add onboarding progress indicator", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 2 },
  { title: "Send welcome email with portal links", project: "Phase 2: Admin Experience", labels: ["Feature"], priority: 2 },

  // ========== PHASE 3: COLLECTIONS ==========
  { title: "Create collections route (/collections/)", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Build at-risk deals list sorted by severity", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Add days past due column to collections view", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Add NSF count column to collections view", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Create risk level field (Low/Medium/High/Critical)", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Build risk level assignment dropdown", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Add assignee field for deal ownership", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Implement filter by assignee", project: "Phase 3: Collections", labels: ["Feature"], priority: 2 },
  { title: "Create collections_deal_meta table migration", project: "Phase 3: Collections", labels: ["Database"], priority: 1 },
  { title: "Build notes drawer (slide-out panel)", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Implement add note with timestamp", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Create note history timeline", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Add follow-up date picker", project: "Phase 3: Collections", labels: ["Feature"], priority: 1 },
  { title: "Create collections_notes table migration", project: "Phase 3: Collections", labels: ["Database"], priority: 1 },
  { title: "Make risk level visible in admin dashboard", project: "Phase 3: Collections", labels: ["Feature"], priority: 2 },
  { title: "Add quick actions (call, email, note buttons)", project: "Phase 3: Collections", labels: ["Feature"], priority: 2 },

  // ========== PHASE 4: LETTERS ==========
  { title: "Create payoff letter template with React-PDF", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Build letter generation API endpoint", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Create PDF preview in modal", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Add PDF download button", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Create zero balance confirmation letter", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Build payoff discount calculator modal", project: "Phase 4: Letters", labels: ["Feature"], priority: 2 },
  { title: "Create renewal letter template", project: "Phase 4: Letters", labels: ["Feature"], priority: 2 },
  { title: "Enable merchant portal letter requests", project: "Phase 4: Letters", labels: ["Feature"], priority: 1 },
  { title: "Generate pay run PDF (payment history statement)", project: "Phase 4: Letters", labels: ["Feature"], priority: 2 },

  // ========== PHASE 5: ACCESS CONTROL ==========
  { title: "Implement role enum (ADMIN/REP/MERCHANT)", project: "Phase 5: Access Control", labels: ["Feature"], priority: 1 },
  { title: "Add admin email domain check (auto-admin for @company.com)", project: "Phase 5: Access Control", labels: ["Feature"], priority: 1 },
  { title: "Create rep portal with filtered deals", project: "Phase 5: Access Control", labels: ["Feature"], priority: 1 },
  { title: "Update navigation based on user role", project: "Phase 5: Access Control", labels: ["Feature"], priority: 1 },
  { title: "Rename all @midday/* imports to @abacus/* (956 files)", project: "Phase 5: Access Control", labels: ["Refactor"], priority: 1 },
  { title: "Update package.json names to @abacus/*", project: "Phase 5: Access Control", labels: ["Refactor"], priority: 1 },
  { title: "Rename environment variables MIDDAY_* → ABACUS_*", project: "Phase 5: Access Control", labels: ["Refactor"], priority: 1 },
  { title: "Update email template branding", project: "Phase 5: Access Control", labels: ["Refactor"], priority: 2 },
  { title: "Verify full build passes (bun build)", project: "Phase 5: Access Control", labels: ["Testing"], priority: 1 },

  // ========== PHASE 6: ALERTS ==========
  { title: "Create NSF alert email notification", project: "Phase 6: Alerts", labels: ["Feature"], priority: 1 },
  { title: "Implement late payment alert with configurable threshold", project: "Phase 6: Alerts", labels: ["Feature"], priority: 1 },
  { title: "Build notification preferences UI", project: "Phase 6: Alerts", labels: ["Feature"], priority: 2 },
  { title: "Create email templates for alerts", project: "Phase 6: Alerts", labels: ["Feature"], priority: 2 },
  { title: "Build weekly portfolio summary email", project: "Phase 6: Alerts", labels: ["Feature"], priority: 1 },
  { title: "Implement AI note summarization with Claude", project: "Phase 6: Alerts", labels: ["Feature"], priority: 2 },
  { title: "Create 'Merchants need attention' bundled alert", project: "Phase 6: Alerts", labels: ["Feature"], priority: 2 },
  { title: "Implement risk score calculation algorithm", project: "Phase 6: Alerts", labels: ["Feature"], priority: 2 },

  // ========== PHASE 7: LAUNCH ==========
  { title: "Optimize dashboard load time (< 2 seconds)", project: "Phase 7: Launch", labels: ["Performance"], priority: 1 },
  { title: "Improve mobile-responsive design", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },
  { title: "Create almost finished table (90-100% paid deals)", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },
  { title: "Create upcoming renewals table (50-90% paid)", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },
  { title: "Tune error monitoring (Sentry)", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },
  { title: "Implement billing integration (Stripe subscription enforcement)", project: "Phase 7: Launch", labels: ["Feature"], priority: 1 },
  { title: "Build referral flow (invite new customers)", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },
  { title: "Conduct security audit (RLS policies review)", project: "Phase 7: Launch", labels: ["Security"], priority: 1 },
  { title: "Create onboarding docs / help guides", project: "Phase 7: Launch", labels: ["Documentation"], priority: 2 },
  { title: "Execute customer success outreach", project: "Phase 7: Launch", labels: ["Feature"], priority: 2 },

  // ========== SUPPORT & FEEDBACK ==========
  { title: "Build feedback widget component (packages/ui)", project: "Support & Feedback", labels: ["Feature"], priority: 1 },
  { title: "Create support ticket API endpoint", project: "Support & Feedback", labels: ["Feature"], priority: 1 },
  { title: "Integrate feedback widget into dashboard", project: "Support & Feedback", labels: ["Feature"], priority: 1 },
  { title: "Integrate feedback widget into merchant portal", project: "Support & Feedback", labels: ["Feature"], priority: 1 },
  { title: "Integrate feedback widget into marketing website", project: "Support & Feedback", labels: ["Feature"], priority: 2 },
  { title: "Set up Linear email integration for support@", project: "Support & Feedback", labels: ["Feature"], priority: 2 },
  { title: "Create support issue triage workflow", project: "Support & Feedback", labels: ["Documentation"], priority: 3 },

  // ========== FUTURE: POST-LAUNCH ==========
  { title: "Implement trial extension offer on cancellation", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Create cancellation survey", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Build win-back email sequence", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Implement team invites", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Create referral program ('Invite a funder, get a free month')", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Add usage nudge notifications", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Show trial countdown in dashboard", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Integrate Plaid for bank account connections", project: "Future: Post-Launch", labels: ["Feature"], priority: 2 },
  { title: "Add payment processor integrations (Stripe, Square)", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Implement multi-currency support (CAD, GBP)", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Build white-label portal with custom domains", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
  { title: "Create public API for integrations", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Build portfolio benchmarking feature", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Implement AI-powered predictive risk scoring", project: "Future: Post-Launch", labels: ["Feature"], priority: 2 },
  { title: "Add cohort analysis for deal vintage performance", project: "Future: Post-Launch", labels: ["Feature"], priority: 3 },
  { title: "Build custom reports builder", project: "Future: Post-Launch", labels: ["Feature"], priority: 4 },
];

interface Milestone {
  name: string;
  project: string;
  targetDate: string;
  description: string;
}

const MILESTONES: Milestone[] = [
  // Phase 0: Foundation
  { name: "Auth Flow Complete", project: "Phase 0: Foundation", targetDate: "2026-02-05", description: "Login, signup, forgot password, team creation working. Users can sign in and create teams." },
  { name: "Payment Ready", project: "Phase 0: Foundation", targetDate: "2026-02-08", description: "Stripe integration, 14-day trial logic active. Users can start trial with payment info collected." },

  // Phase 1: Data Foundation
  { name: "Sheets Connected", project: "Phase 1: Data Foundation", targetDate: "2026-02-15", description: "Google Sheets OAuth flow working. Users can authorize and select spreadsheets." },
  { name: "Column Mapping Live", project: "Phase 1: Data Foundation", targetDate: "2026-02-22", description: "AI-suggested column mappings working. MainSheet → mca_deals syncing." },
  { name: "Payments Syncing", project: "Phase 1: Data Foundation", targetDate: "2026-03-01", description: "PMT sheet → mca_payments. Ledger balance calculations accurate. NSF logic working." },
  { name: "Pilot Go-Live", project: "Phase 1: Data Foundation", targetDate: "2026-03-08", description: "Honest Funding + Emmy Capital fully synced and operational." },

  // Phase 2: Admin Experience
  { name: "Dashboard Operational", project: "Phase 2: Admin Experience", targetDate: "2026-03-15", description: "Portfolio summary cards visible. At-risk indicators working. Navigation updated." },
  { name: "Deal Management Complete", project: "Phase 2: Admin Experience", targetDate: "2026-03-29", description: "Deals table with sorting/filtering. Search, status filters, deal detail pages working." },
  { name: "Onboarding Wizard Live", project: "Phase 2: Admin Experience", targetDate: "2026-04-05", description: "First-time setup wizard working. Welcome email sending." },

  // Phase 3: Collections
  { name: "Collections Queue Live", project: "Phase 3: Collections", targetDate: "2026-04-12", description: "At-risk deals prioritized and visible. Days past due and NSF columns working." },
  { name: "Risk & Assignment Working", project: "Phase 3: Collections", targetDate: "2026-04-19", description: "Risk levels (Low/Medium/High/Critical), assignees, filters all operational." },
  { name: "Notes Workflow Complete", project: "Phase 3: Collections", targetDate: "2026-04-26", description: "Notes drawer, timestamps, history timeline, follow-up dates all working." },
  { name: "Collections Daily-Drivable", project: "Phase 3: Collections", targetDate: "2026-05-03", description: "Collections workflow fully operational for daily use." },

  // Phase 4: Letters
  { name: "PDF Generation Working", project: "Phase 4: Letters", targetDate: "2026-05-10", description: "Payoff letters generating in <5 seconds. React-PDF template, preview, download." },
  { name: "Letter Suite Live", project: "Phase 4: Letters", targetDate: "2026-05-17", description: "Zero balance, renewal letters. Merchant portal letter requests working." },

  // Phase 5: Access Control
  { name: "RBAC Implemented", project: "Phase 5: Access Control", targetDate: "2026-05-24", description: "Admin/Rep/Merchant roles enforced. Rep portal with filtered deals working." },
  { name: "Namespace Migration Done", project: "Phase 5: Access Control", targetDate: "2026-05-31", description: "@midday → @abacus complete (956 files). Build passes." },

  // Phase 6: Alerts
  { name: "Push Notifications Live", project: "Phase 6: Alerts", targetDate: "2026-06-07", description: "NSF and late payment alerts sending within 5 minutes. Notification preferences working." },
  { name: "Weekly Summaries Sending", project: "Phase 6: Alerts", targetDate: "2026-06-14", description: "Monday portfolio digest live. AI insights working." },

  // Phase 7: Launch
  { name: "Performance Optimized", project: "Phase 7: Launch", targetDate: "2026-06-21", description: "Dashboard <2s load time. Mobile responsive. No console errors. Sentry tuned." },
  { name: "Public Launch", project: "Phase 7: Launch", targetDate: "2026-07-01", description: "Billing enforced. Security audit complete. Help docs live. 🚀" },
];

// ============================================================================
// MAIN IMPORT LOGIC
// ============================================================================

async function main() {
  console.log("🚀 Starting Linear import for Abacus...\n");

  // Step 1: Get or create team
  console.log("📋 Step 1: Finding or creating team...");
  const teamsData = await linearQuery(`
    query {
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  `);

  let team = teamsData.teams.nodes.find((t: { name: string }) => t.name === "Abacus");

  if (!team) {
    console.log("   Creating new Abacus team...");
    const createTeam = await linearQuery(`
      mutation CreateTeam($input: TeamCreateInput!) {
        teamCreate(input: $input) {
          success
          team {
            id
            name
            key
          }
        }
      }
    `, {
      input: {
        name: "Abacus",
        key: "ABA",
        description: "MCA Portfolio Management Platform"
      }
    });
    team = createTeam.teamCreate.team;
    console.log(`   ✅ Created team: ${team.name} (${team.key})`);
  } else {
    console.log(`   ✅ Found existing team: ${team.name} (${team.key})`);
  }

  const teamId = team.id;

  // Step 2: Create labels
  console.log("\n🏷️  Step 2: Creating labels...");
  const existingLabelsData = await linearQuery(`
    query($teamId: String!) {
      team(id: $teamId) {
        labels {
          nodes {
            id
            name
          }
        }
      }
    }
  `, { teamId });

  const existingLabels = new Map(
    existingLabelsData.team.labels.nodes.map((l: { name: string; id: string }) => [l.name, l.id])
  );

  const labelMap = new Map<string, string>();

  for (const label of LABELS) {
    if (existingLabels.has(label.name)) {
      labelMap.set(label.name, existingLabels.get(label.name)!);
      console.log(`   ⏭️  Label exists: ${label.name}`);
    } else {
      const result = await linearQuery(`
        mutation CreateLabel($input: IssueLabelCreateInput!) {
          issueLabelCreate(input: $input) {
            success
            issueLabel {
              id
              name
            }
          }
        }
      `, {
        input: {
          name: label.name,
          color: label.color,
          teamId
        }
      });
      labelMap.set(label.name, result.issueLabelCreate.issueLabel.id);
      console.log(`   ✅ Created label: ${label.name}`);
    }
  }

  // Step 3: Create or update projects
  console.log("\n📁 Step 3: Creating/updating projects...");
  const existingProjectsData = await linearQuery(`
    query($teamId: String!) {
      team(id: $teamId) {
        projects {
          nodes {
            id
            name
          }
        }
      }
    }
  `, { teamId });

  const existingProjects = new Map(
    existingProjectsData.team.projects.nodes.map((p: { name: string; id: string }) => [p.name, p.id])
  );

  const projectMap = new Map<string, string>();

  for (const project of PROJECTS) {
    if (existingProjects.has(project.name)) {
      // UPDATE existing project with new description and target date
      const projectId = existingProjects.get(project.name)!;
      projectMap.set(project.name, projectId);

      // Linear has 255 char limit for project descriptions - truncate if needed
      const truncatedDesc = project.description.length > 255
        ? project.description.substring(0, 252) + "..."
        : project.description;

      await linearQuery(`
        mutation UpdateProject($id: String!, $input: ProjectUpdateInput!) {
          projectUpdate(id: $id, input: $input) {
            success
            project {
              id
              name
            }
          }
        }
      `, {
        id: projectId,
        input: {
          description: truncatedDesc,
          color: project.color,
          targetDate: project.targetDate || null
        }
      });
      console.log(`   ✏️  Updated project: ${project.name}`);
    } else {
      // Create new project
      // Linear has 255 char limit for project descriptions
      const truncatedDesc = project.description.length > 255
        ? project.description.substring(0, 252) + "..."
        : project.description;

      const result = await linearQuery(`
        mutation CreateProject($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            success
            project {
              id
              name
            }
          }
        }
      `, {
        input: {
          name: project.name,
          description: truncatedDesc,
          color: project.color,
          teamIds: [teamId],
          targetDate: project.targetDate || null
        }
      });
      projectMap.set(project.name, result.projectCreate.project.id);
      const labelNames = project.labels?.join(", ") || "none";
      console.log(`   ✅ Created project: ${project.name} [${labelNames}]`);
    }
  }

  // Step 4: Create issues
  console.log("\n📝 Step 4: Creating issues...");
  let created = 0;
  let skipped = 0;

  // Get existing issues to avoid duplicates
  const existingIssuesData = await linearQuery(`
    query($teamId: String!) {
      team(id: $teamId) {
        issues(first: 250) {
          nodes {
            title
          }
        }
      }
    }
  `, { teamId });

  const existingIssueTitles = new Set(
    existingIssuesData.team.issues.nodes.map((i: { title: string }) => i.title)
  );

  for (const issue of ISSUES) {
    if (existingIssueTitles.has(issue.title)) {
      skipped++;
      continue;
    }

    const labelIds = (issue.labels || [])
      .map(l => labelMap.get(l))
      .filter(Boolean);

    const projectId = projectMap.get(issue.project);

    await linearQuery(`
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
          }
        }
      }
    `, {
      input: {
        title: issue.title,
        description: issue.description || "",
        teamId,
        projectId,
        labelIds,
        priority: issue.priority || 3
      }
    });

    created++;
    if (created % 10 === 0) {
      console.log(`   📝 Created ${created} issues...`);
    }
  }

  console.log(`   ✅ Created ${created} issues (${skipped} skipped - already exist)`);

  // Step 5: Create project milestones
  console.log("\n🎯 Step 5: Creating project milestones...");
  let milestonesCreated = 0;
  let milestonesSkipped = 0;

  for (const milestone of MILESTONES) {
    const projectId = projectMap.get(milestone.project);
    if (!projectId) {
      console.log(`   ⚠️  Project not found for milestone: ${milestone.name} (${milestone.project})`);
      continue;
    }

    try {
      await linearQuery(`
        mutation CreateProjectMilestone($input: ProjectMilestoneCreateInput!) {
          projectMilestoneCreate(input: $input) {
            success
            projectMilestone {
              id
              name
            }
          }
        }
      `, {
        input: {
          name: milestone.name,
          description: milestone.description,
          targetDate: milestone.targetDate,
          projectId
        }
      });
      milestonesCreated++;
      console.log(`   ✅ Created milestone: ${milestone.name} (${milestone.targetDate})`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle duplicate milestone error
      if (errorMessage.includes("not unique") || errorMessage.includes("already exists")) {
        milestonesSkipped++;
        console.log(`   ⏭️  Milestone exists: ${milestone.name}`);
        continue;
      }

      // If project milestone API doesn't exist, fall back to creating as issue
      if (errorMessage.includes("projectMilestoneCreate")) {
        console.log(`   ⚠️  ProjectMilestone API not available, creating as issue...`);
        if (!existingIssueTitles.has(`🎯 ${milestone.name}`)) {
          await linearQuery(`
            mutation CreateIssue($input: IssueCreateInput!) {
              issueCreate(input: $input) {
                success
              }
            }
          `, {
            input: {
              title: `🎯 ${milestone.name}`,
              description: `${milestone.description}\n\nTarget Date: ${milestone.targetDate}`,
              teamId,
              projectId,
              priority: 1
            }
          });
          milestonesCreated++;
          console.log(`   ✅ Created milestone (as issue): ${milestone.name}`);
        } else {
          milestonesSkipped++;
          console.log(`   ⏭️  Milestone issue exists: ${milestone.name}`);
        }
      } else {
        throw error;
      }
    }
  }

  console.log(`   ✅ Milestones: ${milestonesCreated} created, ${milestonesSkipped} skipped`);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("🎉 Import complete!");
  console.log("=".repeat(50));
  console.log(`   Team: ${team.name} (${team.key})`);
  console.log(`   Projects: ${PROJECTS.length} (with target dates Feb 2 → Jul 1, 2026)`);
  console.log(`   Labels: ${LABELS.length} (including Migration, Feature-Parity, Net-New)`);
  console.log(`   Issues: ${created} created, ${skipped} skipped`);
  console.log(`   Milestones: ${MILESTONES.length} (across ${new Set(MILESTONES.map(m => m.project)).size} phases)`);
  console.log("\n🔗 Open Linear to see your imported roadmap!");
}

main().catch(console.error);
