# Week 1 PRD: Google Sheets OAuth Connection

## Phase
**DATA FOUNDATION** (Weeks 1-4) — Week 1 of 4

## Sprint Goal

**Goal**: Connect a Google Sheet to Abacus via OAuth and display basic spreadsheet metadata in the dashboard.

**Demo**: User clicks "Connect Google Sheet" → completes Google OAuth consent → selects a spreadsheet → sees spreadsheet name and sheet tabs displayed in Abacus settings.

---

## Context

This is the foundation of Abacus's core value proposition: "Connect your Google Sheet, see your portfolio." Week 1 establishes the OAuth plumbing that all subsequent spreadsheet features depend on.

### Why This Matters
- **5-minute time-to-value** starts with frictionless sheet connection
- No data migration required — works with existing spreadsheets
- Foundation for Week 2 (column mapping) and Week 3 (payment sync)

### Technical Foundation Available
- OAuth 2.0 framework already implemented ([oauth.ts](../../apps/api/src/rest/routers/oauth.ts))
- `googleapis@168.0.0` already installed
- Inbox accounts pattern provides reference implementation ([inbox-accounts.ts](../../packages/db/src/queries/inbox-accounts.ts))
- Encryption utilities available for token storage

---

## Task Breakdown

### Task 1: Database Schema for Google Sheets Connections

**Description**: Create the database table and types for storing Google Sheets OAuth credentials and connection metadata, following the inbox accounts pattern.

**Validation**:
- [ ] `google_sheets_connections` table created in schema
- [ ] Migration generated and applies cleanly
- [ ] TypeScript types generated (`bun generate:types`)
- [ ] RLS policies enforce team-based access control

**Files**:
- [packages/db/src/schema.ts](../../packages/db/src/schema.ts) — Add `googleSheetsConnections` table
- `supabase/migrations/YYYYMMDD_google_sheets_connections.sql` — New migration file

**Schema Fields**:
```
id, createdAt, teamId, userId
accessToken (encrypted), refreshToken (encrypted), expiryDate
spreadsheetId, spreadsheetName, spreadsheetUrl
status (connected/disconnected/error), errorMessage
lastSyncedAt, syncEnabled
```

---

### Task 2: Google Sheets OAuth Flow — Backend

**Description**: Implement the server-side OAuth flow for Google Sheets API access, including authorization URL generation, callback handling, and token storage.

**Validation**:
- [ ] `/api/google-sheets/connect` returns valid Google OAuth URL with correct scopes
- [ ] `/api/google-sheets/callback` exchanges code for tokens
- [ ] Tokens stored encrypted in database
- [ ] Token refresh logic handles expired access tokens
- [ ] Error handling for denied consent, invalid codes

**Files**:
- [apps/api/src/rest/routers/google-sheets.ts](../../apps/api/src/rest/routers/) — New router (create)
- [packages/db/src/queries/google-sheets.ts](../../packages/db/src/queries/) — CRUD queries (create)
- [apps/api/src/rest/index.ts](../../apps/api/src/rest/index.ts) — Register new router

**Required Scopes**:
- `https://www.googleapis.com/auth/spreadsheets.readonly` (read sheet data)
- `https://www.googleapis.com/auth/drive.metadata.readonly` (list spreadsheets)

---

### Task 3: Google Sheets OAuth Flow — Frontend

**Description**: Create the UI components for initiating Google Sheets connection, including the connect button, OAuth redirect handling, and connection status display.

**Validation**:
- [ ] "Connect Google Sheet" button visible in settings
- [ ] Clicking button redirects to Google consent screen
- [ ] Successful auth redirects back to Abacus with success toast
- [ ] Failed/cancelled auth shows error message
- [ ] Loading state during OAuth flow

**Files**:
- [apps/dashboard/src/components/google-sheets-connect.tsx](../../apps/dashboard/src/components/) — New component (create)
- [apps/dashboard/src/app/[locale]/app/settings/integrations/page.tsx](../../apps/dashboard/src/app/) — Add to integrations page (create if needed)
- [apps/dashboard/src/app/api/google-sheets/callback/route.ts](../../apps/dashboard/src/app/api/) — Callback handler (create)

---

### Task 4: Spreadsheet Picker & Metadata Display

**Description**: After OAuth, allow user to select which spreadsheet to connect and display its metadata (name, sheet tabs, last modified).

**Validation**:
- [ ] After OAuth, user sees list of their Google Sheets
- [ ] User can select a spreadsheet from the list
- [ ] Selected spreadsheet's metadata displayed (name, URL, sheet tabs)
- [ ] Connection appears in integrations list with status badge
- [ ] User can disconnect a spreadsheet

**Files**:
- [apps/dashboard/src/components/google-sheets-picker.tsx](../../apps/dashboard/src/components/) — Spreadsheet selection modal (create)
- [apps/dashboard/src/components/google-sheets-connection-card.tsx](../../apps/dashboard/src/components/) — Display connected sheet (create)
- [apps/api/src/rest/routers/google-sheets.ts](../../apps/api/src/rest/routers/) — Add list/disconnect endpoints

---

### Task 5: Environment Configuration & Security

**Description**: Set up Google Cloud project credentials and ensure secure configuration for OAuth.

**Validation**:
- [ ] Google Cloud project created with Sheets API enabled
- [ ] OAuth 2.0 credentials configured (client ID, client secret)
- [ ] Environment variables documented and added to `.env.example`
- [ ] Redirect URIs configured for local and production
- [ ] Credentials work in both development and production

**Files**:
- [.env.example](../../.env.example) — Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- [apps/api/src/config/google.ts](../../apps/api/src/config/) — Google config module (create)

**Environment Variables**:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-sheets/callback
```

---

## Exit Criteria

- [ ] User can complete full OAuth flow: click connect → Google consent → select sheet → see metadata
- [ ] Connected sheets persist across sessions (stored in database)
- [ ] User can disconnect a sheet
- [ ] `bun build` passes
- [ ] `bun test` passes (if tests exist)
- [ ] Manual demo of complete flow works on localhost

---

## Key Dependencies

- Google Cloud Console access for creating OAuth credentials
- Supabase CLI for migrations (`supabase db push`)
- No dependencies on previous sprints (Week 1 is the start)

---

## Technical Notes

### OAuth Flow Sequence
```
1. User clicks "Connect Google Sheet"
2. Frontend calls GET /api/google-sheets/connect
3. Backend generates Google OAuth URL with state parameter
4. User redirected to Google consent screen
5. User grants permission, Google redirects to callback
6. Backend exchanges code for tokens, stores encrypted
7. Frontend shows spreadsheet picker
8. User selects sheet, metadata saved
9. Connection displayed in settings
```

### Security Considerations
- Encrypt refresh tokens at rest using `@midday/encryption`
- Use state parameter to prevent CSRF
- Validate redirect URI matches configuration
- Store only necessary scopes (readonly for now)

### Reference Files
- OAuth pattern: [apps/api/src/rest/routers/oauth.ts](../../apps/api/src/rest/routers/oauth.ts)
- Credentials storage: [packages/db/src/queries/inbox-accounts.ts](../../packages/db/src/queries/inbox-accounts.ts)
- Schema pattern: [packages/db/src/schema.ts](../../packages/db/src/schema.ts) (inboxAccounts table)

---

## Verification

After implementation:
1. Run `bun build` — must pass
2. Run `supabase db push` — migration applies cleanly
3. Run `bun generate:types` — types regenerate
4. Manual test: Complete OAuth flow end-to-end
5. Verify in Supabase dashboard: connection record created with encrypted tokens
6. Deploy to staging and verify OAuth works with production redirect URIs

---

## Customer Milestone

**Week 4 Target**: 2 pilot customers migrated

Week 1 establishes the OAuth foundation. By end of Week 4, the full data foundation (OAuth + column mapping + sync) should be ready for pilot customer onboarding.
