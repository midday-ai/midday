# Fix Production Sign-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the "Something went wrong" error when navigating to the login page on production (app.abacuslabs.co)

**Architecture:** The root cause is malformed Vercel environment variables containing literal `\n` characters, which breaks URL construction in the middleware and OAuth flow. We'll fix the env vars, verify Supabase OAuth configuration, and test the complete sign-in flow.

**Tech Stack:** Vercel CLI, Supabase (OAuth), Next.js middleware

---

## Diagnosis Summary

**Symptom:** Clicking "Sign In" on abacuslabs.co redirects to app.abacuslabs.co/login and immediately shows "Something went wrong"

**Root Cause:** The following Vercel production environment variables have literal `\n` appended:
- `NEXT_PUBLIC_URL="https://app.abacuslabs.co\n"` (should be `https://app.abacuslabs.co`)
- `NEXT_PUBLIC_API_URL="https://abacus-api.fly.dev\n"` (should be `https://abacus-api.fly.dev`)
- `ENGINE_API_KEY="secret\n"` (should be cleaned up properly)

This causes `getUrl()` in `apps/dashboard/src/utils/environment.ts` to return a malformed URL, breaking:
1. Middleware URL construction
2. OAuth redirect URL generation
3. Any URL-based logic on the server

---

## Task 1: Fix Vercel Environment Variables

**Files:**
- External: Vercel Dashboard or CLI

**Step 1: Remove the malformed NEXT_PUBLIC_URL and re-add correctly**

Run:
```bash
cd apps/dashboard
vercel env rm NEXT_PUBLIC_URL production
```
Expected: Prompted to confirm removal, then success message

**Step 2: Add NEXT_PUBLIC_URL with correct value**

Run:
```bash
cd apps/dashboard
echo -n "https://app.abacuslabs.co" | vercel env add NEXT_PUBLIC_URL production
```
Expected: Success message confirming env var added

**Step 3: Fix NEXT_PUBLIC_API_URL**

Run:
```bash
cd apps/dashboard
vercel env rm NEXT_PUBLIC_API_URL production
echo -n "https://abacus-api.fly.dev" | vercel env add NEXT_PUBLIC_API_URL production
```
Expected: Success messages for removal and addition

**Step 4: Fix ENGINE_API_KEY and ENGINE_API_URL**

Run:
```bash
cd apps/dashboard
vercel env rm ENGINE_API_KEY production
vercel env rm ENGINE_API_URL production
```
Note: These appear to have placeholder values ("secret\n", "https://your-engine.fly.dev"). Either:
- Set proper values if you have an engine service
- Leave them removed if not using the engine feature

**Step 5: Verify environment variables are fixed**

Run:
```bash
cd apps/dashboard
vercel env pull .env.check --environment=production
cat .env.check | grep -E "^NEXT_PUBLIC_URL=|^NEXT_PUBLIC_API_URL="
rm .env.check
```
Expected output:
```
NEXT_PUBLIC_URL="https://app.abacuslabs.co"
NEXT_PUBLIC_API_URL="https://abacus-api.fly.dev"
```
(No `\n` at the end)

**Step 6: Commit (nothing to commit - env vars are external)**

No code changes needed for this task.

---

## Task 2: Verify Supabase OAuth Configuration

**Files:**
- External: Supabase Dashboard

**Step 1: Check Supabase Site URL**

1. Go to https://supabase.com/dashboard/project/ubbkuicqxbpagwfyidke/auth/url-configuration
2. Verify "Site URL" is set to: `https://app.abacuslabs.co`

Expected: Site URL should be `https://app.abacuslabs.co` (not localhost)

**Step 2: Check Redirect URLs**

1. On the same page, verify "Redirect URLs" includes:
   - `https://app.abacuslabs.co/**`
   - OR at minimum: `https://app.abacuslabs.co/api/auth/callback`

Expected: At least one production redirect URL pattern

**Step 3: Verify Google OAuth is enabled**

1. Go to https://supabase.com/dashboard/project/ubbkuicqxbpagwfyidke/auth/providers
2. Verify "Google" is enabled
3. Verify Client ID and Client Secret are set

Expected: Google provider shows "Enabled" with credentials configured

**Step 4: Document findings**

Note any issues found for fixing in next steps.

---

## Task 3: Verify Google Cloud Console Configuration (if needed)

**Files:**
- External: Google Cloud Console

**Step 1: Check OAuth 2.0 credentials**

1. Go to https://console.cloud.google.com/apis/credentials
2. Select the OAuth 2.0 Client ID used for Abacus
3. Verify "Authorized JavaScript origins" includes:
   - `https://app.abacuslabs.co`
   - `https://ubbkuicqxbpagwfyidke.supabase.co`

4. Verify "Authorized redirect URIs" includes:
   - `https://ubbkuicqxbpagwfyidke.supabase.co/auth/v1/callback`

Expected: All production URLs are whitelisted

---

## Task 4: Trigger Production Deployment

**Files:**
- None (deployment action)

**Step 1: Trigger a new deployment to pick up env var changes**

Run:
```bash
cd apps/dashboard
vercel --prod
```
Expected: Build starts, completes successfully, shows production URL

**Step 2: Wait for deployment to complete**

Monitor the deployment URL in the output until status shows "Ready"

---

## Task 5: Test Sign-In Flow

**Files:**
- None (manual testing)

**Step 1: Clear browser cookies for app.abacuslabs.co**

In browser, clear all cookies/storage for `app.abacuslabs.co`

**Step 2: Test navigation to login page**

1. Open https://abacuslabs.co in browser
2. Click "Sign In" button
3. Verify you land on https://app.abacuslabs.co/login without "Something went wrong"

Expected: Login page loads with Google, OTP, and Email/Password options

**Step 3: Test Google OAuth flow**

1. Click "Continue with Google"
2. Select a Google account
3. Complete authentication

Expected: Redirected back to app.abacuslabs.co and either:
- Landed on dashboard (if user exists)
- Landed on /teams/create (if new user)

**Step 4: Document results**

If any step fails, capture:
- Browser console errors
- Network tab errors
- URL at point of failure

---

## Troubleshooting

### If login page still shows "Something went wrong"

1. Check Vercel function logs:
```bash
cd apps/dashboard
vercel logs https://app.abacuslabs.co --format=json | head -100
```

2. Check browser console for specific error messages

3. Verify middleware isn't throwing by adding temporary logging

### If Google OAuth fails with "access_denied"

1. Verify Google Cloud Console redirect URIs match exactly
2. Verify Supabase redirect URLs are configured
3. Check if OAuth consent screen is in "Testing" mode (limits who can sign in)

### If OAuth redirects to localhost

1. Double-check `NEXT_PUBLIC_URL` env var has no `\n`
2. Verify the deployment picked up the new env vars (redeploy if needed)
3. Check `getUrl()` function in browser dev tools network tab

---

## Success Criteria

- [ ] Login page at app.abacuslabs.co/login loads without errors
- [ ] "Continue with Google" initiates OAuth flow correctly
- [ ] After Google authentication, user is redirected back to app.abacuslabs.co
- [ ] User lands on dashboard or team creation page based on their account state
