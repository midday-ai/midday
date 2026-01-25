
# Week 0 PRD: Authentication & Onboarding Foundation

## Phase
**FOUNDATION** — Pre-requisite for Week 1

## Sprint Goal

**Goal**: Establish working end-to-end authentication and team creation flows so new users can sign up and access the dashboard.

**Demo**: User clicks "Sign in" on homepage → completes Google OAuth → lands on team creation → creates team → sees empty dashboard ready for Week 1 (Google Sheets connection).

---

## Context

Before Week 1's Google Sheets integration can work, users need to be able to:
1. Sign in from the marketing site
2. Complete Google OAuth authorization
3. Create a team (for new users) or select existing team (returning users)
4. Land in the dashboard

### Current State
The authentication infrastructure exists but the end-to-end flow has issues:
- Sign-in button on homepage links to `/login`
- Google OAuth component exists ([google-sign-in.tsx](../../apps/dashboard/src/components/google-sign-in.tsx))
- OAuth callback handler exists ([callback/route.ts](../../apps/dashboard/src/app/api/auth/callback/route.ts))
- Team creation page exists ([teams/create/page.tsx](../../apps/dashboard/src/app/[locale]/(app)/teams/create/page.tsx))
- Middleware enforces routing guards ([middleware.ts](../../apps/dashboard/src/middleware.ts))

### What Needs to Work
- [ ] Complete sign-in → OAuth → team creation → dashboard flow
- [ ] "Setup my business" CTA flow (if applicable)
- [ ] Returning user sign-in flow

---

## Login Page Design

### Visual Specification

The login page should follow Abacus's design aesthetic (Mercury/Ramp/Linear influenced):

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Abacus Logo]                      │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │  Sign In              [Stay signed in]  │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │     G  Continue with Google     │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ─────────── OR ───────────            │   │
│   │                                         │   │
│   │  Email address                          │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │                                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Password          Forgot Password?     │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │                                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │         Sign In (sky-500)       │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Don't have an account? Sign up         │   │
│   │                                         │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
│   Protected by reCAPTCHA - Privacy & Terms      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Design Elements

| Element | Specification |
|---------|---------------|
| **Background** | Light gray (#f8fafc) full page |
| **Card** | White (#ffffff) with subtle shadow, rounded corners |
| **Logo** | Abacus logo centered above card |
| **Primary Button** | Sky-500 (#0ea5e9), white text, full width |
| **Social Button** | White bg, gray border, shadow on hover |
| **Input Fields** | Rounded borders, generous padding |
| **Links** | Sky-600 for "Forgot Password?" and "Sign up" |
| **Typography** | Inter for all text |

### Login Page Components

1. **Header Area**
   - Abacus logo centered
   - Clean, minimal branding

2. **Sign In Card**
   - "Sign In" heading (left aligned)
   - Optional "Stay signed in" toggle (right aligned)

3. **Social Login Section**
   - "Continue with Google" button (primary method)
   - (Optional: "Continue with Apple" if we support it)

4. **Divider**
   - "OR" text with horizontal lines

5. **Email/Password Form**
   - Email address input
   - Password input with "Forgot Password?" link
   - "Sign In" primary button

6. **Sign Up Link**
   - "Don't have an account? **Sign up**"
   - Links to `/signup` or `/register`

7. **Footer**
   - Privacy policy and Terms links
   - reCAPTCHA notice (if implemented)

---

## Sign Up Flow

### New Task: Sign Up Page & Flow

When user clicks "Sign up" from login page, they enter the account creation flow:

### Sign Up Page Design
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Abacus Logo]                      │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │  Create your account                    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │     G  Continue with Google     │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ─────────── OR ───────────            │   │
│   │                                         │   │
│   │  Full name                              │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │                                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Email address                          │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │                                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Password                               │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │                                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │       Create Account            │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  Already have an account? Sign in       │   │
│   │                                         │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
│   By signing up, you agree to our Terms and     │
│   Privacy Policy                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### "No Account Found" Interstitial

When a user clicks "Sign In" with Google but no account exists for that email, show a friendly prompt instead of an error:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Abacus Logo]                      │
│                                                 │
│   ┌─────────────────────────────────────────┐   │
│   │                                         │   │
│   │  Create an account                      │   │
│   │                                         │   │
│   │  There's no existing Abacus account     │   │
│   │  for the Google email:                  │   │
│   │                                         │   │
│   │  user@example.com                       │   │
│   │                                         │   │
│   │  Would you like to sign up?             │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │       Sign up now (sky-500)     │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   │  ┌─────────────────────────────────┐    │   │
│   │  │         Go back                 │    │   │
│   │  └─────────────────────────────────┘    │   │
│   │                                         │   │
│   └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- "Sign up now" → Creates account with that Google email → proceeds to Team Creation
- "Go back" → Returns to Login page

This provides a graceful UX when users try to sign in before they have an account.

---

### Sign Up → Onboarding Flow

The onboarding flow guides new users from account creation to a ready-to-use dashboard.

```
1. Sign Up Page (/signup) OR "No Account Found" interstitial
   └─ User creates account via Google OAuth OR email/password

2. Email Verification (if email/password)
   └─ Verify email address
   └─ Redirect to onboarding after verification

3. Welcome / Value Prop Page (/onboarding/welcome)
   └─ "Try Abacus for free" (if trial) or "Get started with Abacus"
   └─ Value propositions explaining benefits
   └─ Continue button

4. Plan Selection & Payment (/onboarding/plan) [if paid model]
   └─ Personalized greeting: "{Name}, Experience Abacus today"
   └─ Pricing display with trial info
   └─ Stripe payment form (charged after trial)
   └─ "Start your free trial" CTA

5. Team Creation (/onboarding/team OR /teams/create)
   └─ "Create your team"
   └─ Company name, country, currency
   └─ This is where "Don't have a team?" leads if user somehow exists without team

6. Dashboard (/)
   └─ Empty state with Week 1 CTA (Connect Google Sheet)
```

---

## Onboarding Page Designs

### Step 1: Welcome / Value Proposition Page

```
┌─────────────────────────────────────────────────────────────┐
│                     [Abacus Logo]                           │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│        ┌─────────┐                                          │
│        │  14     │  ← Calendar icon                         │
│        │  DAYS   │                                          │
│        │  FREE   │                                          │
│        └─────────┘                                          │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │         Try Abacus for free                         │   │
│   │    You won't be charged anything today              │   │
│   │                                                     │   │
│   │  🚀 Jump right in                                   │   │
│   │     Connect your spreadsheet and start              │   │
│   │     tracking your portfolio in minutes.             │   │
│   │                                                     │   │
│   │  ⭐ Get a new level of clarity                      │   │
│   │     Funders report catching issues 10x              │   │
│   │     faster with real-time alerts.                   │   │
│   │                                                     │   │
│   │  🛡️ We've got your back                             │   │
│   │     Try Abacus risk-free. Cancel anytime            │   │
│   │     with no questions asked.                        │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ ☑ Email me a reminder before my trial ends so I     │   │
│   │   can cancel if Abacus isn't the right fit.         │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Continue (sky-500)                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Plan Selection & Payment Page

```
┌─────────────────────────────────────────────────────────────┐
│                     [Abacus Logo]                           │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│   {First Name},                                             │
│   Experience Abacus today                                   │
│                                                             │
│   ✓ Cancel anytime, no pressure or hassle                   │
│   ✓ We'll remind you before your trial ends                 │
│   ✓ Not for you? Get a refund for unused time               │
│   ✓ Easily track your trial days in your dashboard          │
│                                                             │
│   ┌─────────────────────────────────────┐  ┌──────────┐     │
│   │  $XX / month                        │  │ SAVE XX% │     │
│   │  $XXX per year, billed yearly       │  └──────────┘     │
│   └─────────────────────────────────────┘                   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │         Pay with Link (green)                       │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   ─────────────────── OR ───────────────────                │
│                                                             │
│   Payment details                    Powered by Stripe      │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Card number                        [Autofill link] │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   🏷️ Add a Promo code                                       │
│                                                             │
│   Today's total:                                    $0.00   │
│   After Trial (Billed {date}):                    $XX.XX    │
│                                           plus applicable tax│
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │       Start your free 14-day trial (sky-500)        │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│                      See all plans                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Team Creation Page

```
┌─────────────────────────────────────────────────────────────┐
│                     [Abacus Logo]                           │
│  ═══════════════════════════════════════════════════════    │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                                                     │   │
│   │  Create your team                                   │   │
│   │                                                     │   │
│   │  Company name                                       │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │ Acme Capital                                │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   │                                                     │   │
│   │  Country                                            │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │ United States                          ▼   │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   │                                                     │   │
│   │  Currency                                           │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │ USD ($)                                ▼   │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   │                                                     │   │
│   │  ┌─────────────────────────────────────────────┐    │   │
│   │  │         Create Team (sky-500)               │    │   │
│   │  └─────────────────────────────────────────────┘    │   │
│   │                                                     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 4: Dashboard Welcome Modal

After completing onboarding, users land on the dashboard with a **welcome modal** that kicks off a guided setup:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Dashboard with sidebar, widgets, charts visible but dimmed/background]         │
│                                                                                 │
│        ┌─────────────────────────────────────────────────┐                      │
│        │                                                 │                      │
│        │              [Abacus Logo]                      │                      │
│        │                                                 │                      │
│        │         Welcome to Abacus!                      │                      │
│        │                                                 │                      │
│        │   We'll guide you through a few quick           │                      │
│        │   steps to get started.                         │                      │
│        │                                                 │                      │
│        │     ┌─────────────────────────┐                 │                      │
│        │     │   Continue →  (sky-500) │                 │                      │
│        │     └─────────────────────────┘                 │                      │
│        │                                                 │                      │
│        └─────────────────────────────────────────────────┘                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Behavior**:
- Modal overlays the dashboard (dashboard visible but dimmed behind)
- URL: `/signup/guide/welcome` or modal on `/` with query param
- "Continue" button starts the guided setup steps (e.g., connect Google Sheet)
- User can dismiss modal to explore on their own

**Guided Steps After Welcome** (Week 1+):
1. Connect your Google Sheet
2. Map your columns
3. See your first insights

### Step 5: Connect Your Data Source Modal (Week 1)

After clicking "Continue" on the welcome modal, users see the data connection prompt:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Dashboard with sidebar, widgets, charts visible but dimmed/background]         │
│                                                                                 │
│        ┌─────────────────────────────────────────────────┐                      │
│        │                                                 │                      │
│        │              [Abacus Logo]                      │                      │
│        │                                                 │                      │
│        │      Connect your spreadsheet                   │                      │
│        │                                                 │                      │
│        │   Your data stays yours. We only read           │                      │
│        │   what you share, and your login                │                      │
│        │   stays private.                                │                      │
│        │                                                 │                      │
│        │     ┌───────────────────────────────┐           │                      │
│        │     │ Connect Google Sheet → (sky)  │           │                      │
│        │     └───────────────────────────────┘           │                      │
│        │                                                 │                      │
│        │   ┌─────────────────────────────────────────┐   │                      │
│        │   │  [Preview image of dashboard with       │   │                      │
│        │   │   connected data - charts, metrics]     │   │                      │
│        │   └─────────────────────────────────────────┘   │                      │
│        │                                                 │                      │
│        │            Skip for now                         │                      │
│        │                                                 │                      │
│        └─────────────────────────────────────────────────┘                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- **Privacy reassurance**: "Your data stays yours. We only read what you share, and your login stays private."
- **Preview image**: Shows what the dashboard looks like with data connected (motivates users to complete setup)
- **Skip option**: Users can explore empty dashboard first if they prefer

**URL**: `/signup/guide/connect` or modal on dashboard

**Note**: This modal is part of Week 1 scope (Google Sheets integration), but the welcome modal that precedes it is Week 0.

### Step 6: Data Source Picker (Week 1)

When user clicks "Connect Google Sheet" or accesses connections later, they see a source picker:

```
┌─────────────────────────────────────────────────┐
│  Add a data source                          ✕   │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🔍 Search integrations...               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 📊 Google Sheets              [G logo]  → │  │  ← Primary option
│  │    Connect your portfolio spreadsheet    │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 🏦 Bank accounts              [logos]   → │  │  ← Future: Plaid
│  │    0 connected                           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 💳 Payment processors         [logos]   → │  │  ← Future: Stripe, etc.
│  │    0 connected                           │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ 📁 Import from CSV             [↑]      → │  │
│  │    Upload transaction history            │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Add manual account               │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Abacus Data Sources (Roadmap)**:

| Source | Phase | Description |
|--------|-------|-------------|
| **Google Sheets** | Week 1 | Connect existing portfolio spreadsheet |
| **CSV Import** | Week 1 | Upload transaction/deal history |
| **Manual Entry** | Week 1 | Add deals manually |
| **Bank Accounts** | Future | Plaid integration for payment tracking |
| **Payment Processors** | Future | Stripe, Square for payment reconciliation |

**Design Notes**:
- Each option shows category name, description, status (X connected), and logos of supported services
- Primary CTA (Google Sheets) should be visually emphasized for Week 1
- Future integrations can be shown as "Coming soon" or hidden initially

---

## Phased Delivery Summary

**Decision: Staged Approach** — Break onboarding into clear phases to ship incrementally.

### Week 0: Authentication Foundation
**Goal**: Users can sign in, create account, create team, land on dashboard.

| Deliverable | Description |
|-------------|-------------|
| Login page (`/login`) | Google OAuth + email/password, "Forgot password?", "Sign up" link |
| Sign up page (`/signup`) | Google OAuth + email/password, "Sign in" link |
| "No account found" interstitial | Graceful handling when Google user doesn't exist |
| Forgot password page | Email-based password reset |
| Team creation page | Company name, country, currency |
| Dashboard welcome modal | "Welcome to Abacus!" with "Continue" button |

### Week 0.5: Payment & Trial Flow
**Goal**: Collect payment info, establish trial, monetization-ready.

| Deliverable | Description |
|-------------|-------------|
| Welcome/value prop page | Trial benefits, email reminder opt-in |
| Plan selection page | Pricing display, Stripe payment form |
| Trial logic | 14-day trial, charge after trial ends |
| Promo codes | Support discount codes |

### Week 1: Data Connection
**Goal**: Users can connect their spreadsheet and see data.

| Deliverable | Description |
|-------------|-------------|
| Connect data source modal | Prompt after welcome modal |
| Data source picker | Google Sheets, CSV import, manual entry options |
| Google Sheets OAuth | Connect and authorize spreadsheet access |
| Column mapping | Map spreadsheet columns to Abacus fields |
| Data display | Show imported deals on dashboard |

### Future Sprint: Retention & Engagement
**Goal**: Reduce churn, improve trial conversion, grow through referrals.

| Feature | Description | Inspiration |
|---------|-------------|-------------|
| **Trial extension offer** | When user attempts to cancel trial, offer 7 more days free | Monarch |
| **Cancellation survey** | Ask why they're leaving with clear options (too expensive, missing features, found alternative, etc.) | Monarch |
| **Win-back emails** | Automated email sequence after cancellation | Standard SaaS |
| **Team invites** | Invite team members to collaborate | Growth mechanism |
| **Referral program** | "Invite a funder, get a free month" | Viral growth |
| **Usage nudges** | "You haven't checked your portfolio in 5 days" | Re-engagement |
| **Trial countdown** | Show "X days left in trial" in dashboard | Urgency |

**Note**: These features should be planned after core functionality (Weeks 0-2) is stable.

---

---

## User Flows to Validate

### Flow 1: New User Sign-Up (via Google)
```
1. Homepage (abacuslabs.co)
   └─ Click "Sign in" button

2. Login Page (app.abacuslabs.co/login)
   └─ Click "Don't have an account? Sign up"

3. Sign Up Page (app.abacuslabs.co/signup)
   └─ Click "Continue with Google"

4. Google OAuth Consent
   └─ User authorizes

5. OAuth Callback (/api/auth/callback)
   └─ Exchange code for session
   └─ Check: user has no teams
   └─ Redirect to /teams/create

6. Team Creation (/teams/create)
   └─ Enter company name, country, currency
   └─ Submit form

7. Dashboard (/)
   └─ Empty state with "Connect Google Sheet" CTA (Week 1)
```

### Flow 1B: New User Sign-Up (via Email/Password)
```
1. Homepage (abacuslabs.co)
   └─ Click "Sign in" button

2. Login Page (app.abacuslabs.co/login)
   └─ Click "Don't have an account? Sign up"

3. Sign Up Page (app.abacuslabs.co/signup)
   └─ Enter name, email, password
   └─ Click "Create Account"

4. Email Verification
   └─ Check inbox for verification email
   └─ Click verification link

5. Redirect to Team Creation (/teams/create)
   └─ Enter company name, country, currency
   └─ Submit form

6. Dashboard (/)
   └─ Empty state ready for Week 1
```

### Flow 2: Returning User Sign-In
```
1. Homepage → "Sign in"
2. Login Page → Enter email/password OR "Continue with Google"
3. (If Google) OAuth → Authorize
4. OAuth Callback / Session created
   └─ Check: user has team(s)
   └─ Redirect to / (dashboard)
5. Dashboard with existing data
```

### Flow 3: Direct Sign-Up from Homepage
```
1. Homepage → Click "Get Started" / "Setup my business"
2. Redirect to Sign Up Page (/signup)
3. Continue with Flow 1A or 1B above
```

### Flow 4: Forgot Password
```
1. Login Page → Click "Forgot Password?"
2. Forgot Password Page (/forgot-password)
   └─ Enter email address
   └─ Click "Send Reset Link"
3. Check inbox for reset email
4. Click reset link → Password Reset Page
5. Enter new password → Submit
6. Redirect to Login Page with success message
```

### Flow 5: Sign In with Google (No Account Exists)
```
1. Login Page → Click "Continue with Google"
2. Google OAuth → Authorize
3. OAuth Callback detects: no account for this email
4. "No Account Found" Page
   └─ Shows: "There's no existing Abacus account for: user@email.com"
   └─ "Would you like to sign up?"
5a. Click "Sign up now"
   └─ Creates account with Google email
   └─ Redirects to Team Creation (/teams/create)
   └─ Continues to Dashboard
5b. Click "Go back"
   └─ Returns to Login Page
```

---

## Task Breakdown

### Task 0: Build Login & Sign-Up Pages

**Description**: Create the login and sign-up pages following the design specifications above. These pages are the entry point for all authentication flows.

**Pages to Create/Update**:

1. **Login Page** (`/login`)
   - Google OAuth "Continue with Google" button
   - Email/password form
   - "Forgot Password?" link
   - "Don't have an account? Sign up" link
   - "Stay signed in" toggle (optional)

2. **Sign Up Page** (`/signup`)
   - Google OAuth "Continue with Google" button
   - Full name, email, password form
   - "Create Account" button
   - "Already have an account? Sign in" link
   - Terms/Privacy acceptance

3. **No Account Found Page** (`/no-account` or modal)
   - Shown when Google sign-in finds no existing account
   - Displays the email that was used
   - "Sign up now" → creates account and continues
   - "Go back" → returns to login

4. **Forgot Password Page** (`/forgot-password`)
   - Email input
   - "Send Reset Link" button
   - Success state with instructions

**Validation**:
- [ ] Login page matches design specification
- [ ] Sign up page matches design specification
- [ ] "No account found" interstitial works for new Google users
- [ ] Forgot password flow sends email
- [ ] All pages use Abacus aesthetic (sky-500 primary, shadow borders, Inter font)
- [ ] Mobile responsive

**Files**:
- `apps/dashboard/src/app/[locale]/(public)/login/page.tsx`
- `apps/dashboard/src/app/[locale]/(public)/signup/page.tsx` (new)
- `apps/dashboard/src/app/[locale]/(public)/forgot-password/page.tsx` (new)
- `apps/dashboard/src/components/auth/login-form.tsx` (new or update)
- `apps/dashboard/src/components/auth/signup-form.tsx` (new)

---

### Task 1: Verify Google OAuth Configuration

**Description**: Ensure Google OAuth is properly configured in Supabase and environment variables are set for both local and production.

**Validation**:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Google OAuth provider enabled in Supabase dashboard
- [ ] Redirect URIs configured for localhost and production
- [ ] Clicking "Continue with Google" redirects to Google consent

**Files to Check**:
- `.env.local` / `.env` — Environment variables
- Supabase Dashboard → Authentication → Providers → Google

---

### Task 2: Debug OAuth Callback Flow

**Description**: Trace and fix the OAuth callback handler to ensure proper routing after authentication.

**Validation**:
- [ ] Callback receives authorization code from Google
- [ ] Code exchanges successfully for Supabase session
- [ ] User session is established (check cookies)
- [ ] New users redirect to `/teams/create`
- [ ] Existing users redirect to dashboard `/`
- [ ] Errors redirect to `/login` with error message

**Files**:
- [apps/dashboard/src/app/api/auth/callback/route.ts](../../apps/dashboard/src/app/api/auth/callback/route.ts) — Callback handler
- [apps/dashboard/src/components/google-sign-in.tsx](../../apps/dashboard/src/components/google-sign-in.tsx) — OAuth initiation

**Debug Steps**:
1. Add console logs to callback route
2. Check Supabase logs for auth errors
3. Verify `users_on_team` query works
4. Test redirect logic branches

---

### Task 3: Verify Team Creation Flow

**Description**: Ensure team creation form works and properly creates team + user membership.

**Validation**:
- [ ] `/teams/create` page renders for new users
- [ ] Form accepts: company name, country, currency
- [ ] Submit creates team in database
- [ ] User added to `users_on_team` as owner
- [ ] After creation, redirects to dashboard
- [ ] User's `team_id` updated to new team

**Files**:
- [apps/dashboard/src/app/[locale]/(app)/teams/create/page.tsx](../../apps/dashboard/src/app/[locale]/(app)/teams/create/page.tsx) — Page
- [apps/dashboard/src/components/forms/create-team-form.tsx](../../apps/dashboard/src/components/forms/create-team-form.tsx) — Form component
- [packages/db/src/queries/teams.ts](../../packages/db/src/queries/teams.ts) — `createTeam()` function
- [apps/api/src/trpc/routers/team.ts](../../apps/api/src/trpc/routers/team.ts) — tRPC endpoint

---

### Task 4: Verify Middleware Routing Guards

**Description**: Ensure middleware properly enforces the auth → setup → team → dashboard sequence.

**Validation**:
- [ ] Unauthenticated users redirected to `/login`
- [ ] Authenticated users without team redirected to `/teams`
- [ ] Authenticated users on `/login` redirected to `/`
- [ ] Protected routes inaccessible without auth

**Files**:
- [apps/dashboard/src/middleware.ts](../../apps/dashboard/src/middleware.ts) — Route protection

---

### Task 5: Verify Homepage Sign-In Links

**Description**: Ensure marketing site "Sign in" and any CTA buttons link to correct URLs.

**Validation**:
- [ ] "Sign in" button links to `https://app.abacuslabs.co/login`
- [ ] Any "Get Started" / "Setup my business" buttons work
- [ ] Links work in both development and production
- [ ] Mobile menu sign-in link works

**Files**:
- [apps/website/src/components/header.tsx](../../apps/website/src/components/header.tsx) — Header with sign-in
- Check for any hero section CTAs

---

## Debugging Checklist

### Environment Variables
```
# Dashboard app (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Verify Google OAuth in Supabase Dashboard:
# Authentication → Providers → Google → Enabled
# Client ID and Secret configured
# Redirect URL: https://[project-ref].supabase.co/auth/v1/callback
```

### Common Issues
1. **OAuth redirect mismatch** — Google Cloud Console redirect URIs must match exactly
2. **Supabase provider not enabled** — Check Supabase dashboard
3. **Missing environment variables** — Check both `.env` and `.env.local`
4. **CORS issues** — Check Supabase URL configuration
5. **Session not persisting** — Check cookie settings, domain configuration

### Logs to Check
- Browser console during OAuth flow
- Network tab for callback response
- Supabase Dashboard → Logs → Auth
- Vercel function logs (production)

---

## Exit Criteria (Week 0)

### Core Flows
- [ ] New user can complete: homepage → login page → "Sign up" → signup page → Google OAuth → team creation → dashboard → welcome modal
- [ ] New user can complete: signup page → email/password registration → email verification → team creation → dashboard
- [ ] Existing user without account shown "No account found" interstitial → can sign up from there
- [ ] Returning user can sign in (Google or email/password) and reach dashboard
- [ ] Forgot password flow sends reset email and allows password change

### UI/UX
- [ ] Login page matches Abacus design aesthetic (sky-500 primary, shadow borders, Inter font)
- [ ] Sign up page matches design specification
- [ ] All pages are mobile responsive
- [ ] Welcome modal appears on first dashboard visit

### Technical
- [ ] No errors in console during auth flow
- [ ] Session persists across page refreshes
- [ ] Logout works and returns to login page
- [ ] Middleware correctly guards protected routes

---

## Technical Notes

### Expected OAuth Flow
```
1. User clicks "Continue with Google"
2. supabase.auth.signInWithOAuth({ provider: 'google' })
3. Redirect to Google consent screen
4. Google redirects to: [supabase-url]/auth/v1/callback
5. Supabase exchanges code, creates session
6. Supabase redirects to: /api/auth/callback?code=...
7. Our callback handler:
   - Exchanges code for session (supabase.auth.exchangeCodeForSession)
   - Queries users_on_team for user's teams
   - Redirects based on team status
```

### Key Database Tables
- `auth.users` — Supabase managed user accounts
- `public.users` — Extended user profile (name, avatar, current team)
- `public.teams` — Team/organization records
- `public.users_on_team` — User-team membership (many-to-many)

### Reference Files
- OAuth callback: [apps/dashboard/src/app/api/auth/callback/route.ts](../../apps/dashboard/src/app/api/auth/callback/route.ts)
- Google sign-in: [apps/dashboard/src/components/google-sign-in.tsx](../../apps/dashboard/src/components/google-sign-in.tsx)
- Team creation: [packages/db/src/queries/teams.ts](../../packages/db/src/queries/teams.ts)
- Middleware: [apps/dashboard/src/middleware.ts](../../apps/dashboard/src/middleware.ts)

---

## Notes

_Document issues encountered and resolutions here as you debug:_

-
-
-
