# Collections Module Design

## Overview

A full collections workflow module for managing at-risk MCA deals. Deals flagged as `late`, `defaulted`, or `in_collections` surface automatically as candidates. Collectors can self-assign cases, track outreach with hybrid structured+free-text notes, manage follow-ups with in-app notifications, and move cases through configurable workflow stages. The system includes auto-escalation rules (time and event-based), SLA tracking, per-team configuration, external collections agency management, and merchant-level collections visibility.

## Data Model

### New Tables

#### `collection_stages`
Configurable workflow stages per team.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| name | text | e.g., "Candidate", "Contacting" |
| slug | text | URL-safe identifier |
| position | integer | Order in the workflow |
| color | text | For UI badges |
| isDefault | boolean | Initial stage for new cases |
| isTerminal | boolean | Marks the case as resolved |
| createdAt | timestamp | |

#### `collection_cases`
One case per deal in collections.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| dealId | uuid | FK → mca_deals |
| stageId | uuid | FK → collection_stages |
| assignedTo | uuid | FK → users (nullable) |
| priority | enum | low, medium, high, critical |
| outcome | enum | nullable — paid_in_full, settled, written_off, payment_plan, defaulted, sent_to_agency |
| agencyId | uuid | FK → collection_agencies (nullable — set when outcome is sent_to_agency) |
| nextFollowUp | timestamp | Next follow-up date |
| enteredCollectionsAt | timestamp | When case was created |
| resolvedAt | timestamp | nullable |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### `collection_notes`
Hybrid structured + free-text activity log.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| caseId | uuid | FK → collection_cases |
| authorId | uuid | FK → users |
| contactName | text | Who they spoke to (nullable) |
| contactMethod | enum | phone, email, text, in_person, other (nullable) |
| followUpDate | timestamp | When to follow up (nullable) |
| summary | text | Free-text notes |
| createdAt | timestamp | |

#### `collection_agencies`
External collections agencies configurable per team.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| name | text | Agency name |
| contactName | text | Primary contact person (nullable) |
| contactEmail | text | Contact email (nullable) |
| contactPhone | text | Contact phone (nullable) |
| notes | text | Any notes about this agency (nullable) |
| isActive | boolean | Whether this agency is available for selection |
| createdAt | timestamp | |

#### `collection_escalation_rules`
Configurable auto-escalation per team.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| triggerType | enum | time_based, event_based |
| fromStageId | uuid | FK → collection_stages |
| toStageId | uuid | FK → collection_stages |
| condition | jsonb | e.g., `{"daysInStage": 7}` or `{"event": "missed_payment"}` |
| isActive | boolean | Enable/disable rule |
| createdAt | timestamp | |

#### `collection_sla_configs`
SLA thresholds per team per stage.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| stageId | uuid | FK → collection_stages (nullable — null for global SLAs) |
| metric | enum | time_in_stage, response_time, resolution_time |
| thresholdMinutes | integer | SLA threshold |
| createdAt | timestamp | |

#### `collection_notifications`
In-app notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| teamId | uuid | FK → teams |
| userId | uuid | FK → users (recipient) |
| caseId | uuid | FK → collection_cases |
| type | enum | follow_up_due, sla_breach, escalation, assignment |
| message | text | |
| readAt | timestamp | nullable |
| createdAt | timestamp | |

### Modifications to Existing Tables

- **team_members**: Add `hasCollectionsPermission` boolean (default false)
- **Merchant detail page**: Add a "Collections" section showing the merchant's at-risk deal history, active cases, past outcomes, and any agencies deals were sent to

## Navigation

New sidebar item between "Reconciliation" and "Settings":
- Label: "Collections"
- Path: `/collections`
- Roles: owner, admin, member (with collections permission), syndicate
- Icon: MdOutlineAssignmentLate or similar

## Page Routes

| Route | Purpose |
|-------|---------|
| `/collections` | Dashboard + filterable table |
| `/collections/[id]` | Full detail page for a case |
| `/collections/settings` | Quick-access config |
| `/settings/collections` | Full config in Settings section |

## Main Page (`/collections`)

### Summary Cards (5-column grid)
1. Total Active Cases
2. Total Outstanding Balance
3. Upcoming Follow-ups (due today/this week)
4. Recovery Rate (%)
5. Unassigned Cases

### Tab Filters
- Candidates — deals with `late`/`defaulted` status, no active case yet
- Active — cases in non-terminal stages
- Resolved — cases in terminal stages

### Data Table
Columns: Deal Code, Merchant, Balance, Stage, Assigned To, Priority, Next Follow-up, Days in Stage, SLA Status. Filterable, sortable, row click navigates to `/collections/[id]`. Candidates tab shows "Move to Collections" action.

## Detail Page (`/collections/[id]`)

### Header
Back link, deal code + merchant name, stage badge with dropdown, assign button, priority selector, resolution button (with outcome options including "Send to Agency" which prompts for agency selection).

### Left Column (60%)
- Activity timeline (notes, stage changes, system events)
- Add Note form: contact name, contact method, follow-up date, free-text summary

### Right Column (40%)
- Deal Summary Card (funded amount, payback, balance, total paid, factor rate, funded date)
- Merchant Info Card (name, contact, link to merchant detail, collections history badge)
- Syndication Info Card (syndicator positions if any)
- Payment History (recent payments with status)
- SLA Indicators (time in stage, response time, resolution time with breach warnings)

## Workflow Engine

### Default Stages (seeded per team)

| Position | Stage | Color | Default | Terminal |
|----------|-------|-------|---------|----------|
| 1 | Candidate | gray | yes | no |
| 2 | Assigned | blue | no | no |
| 3 | Contacting | yellow | no | no |
| 4 | Negotiating | orange | no | no |
| 5 | Payment Plan | purple | no | no |
| 6 | Escalated | red | no | no |
| 7 | Resolved | green | no | yes |

Teams can add, remove, rename, reorder, and recolor stages. At least one default and one terminal stage must exist.

### Auto-Escalation Rules

**Time-based** (Trigger.dev cron, runs daily):
- Condition: `{"daysInStage": N}`
- Transitions case to target stage when threshold exceeded
- Logs system note

**Event-based** (inline triggers on payment events):
- Events: `missed_payment`, `nsf_returned`, `payment_plan_missed`, `manual_trigger`
- Hooks into existing ACH/payment processing

### SLA Tracking

| Metric | Measurement | Breach |
|--------|-------------|--------|
| Time in stage | `now - stageEnteredAt` | Exceeds per-stage threshold |
| Response time | `now - nextFollowUp` when overdue | Follow-up passed without activity |
| Resolution time | `now - enteredCollectionsAt` | Total case age exceeds global threshold |

Breach triggers in-app notification to assigned user (or admins if unassigned).

### Notifications

| Trigger | Recipient |
|---------|-----------|
| Follow-up due today | Assigned user |
| Follow-up overdue | Assigned user |
| Case assigned | Assigned user |
| Auto-escalation | Assigned user + admins |
| SLA breach | Assigned user + admins |

Delivered via `collection_notifications` table. Bell icon in header with unread count. Click navigates to case.

## Permissions

| Action | Required |
|--------|----------|
| View collections dashboard | `hasCollectionsPermission` |
| Self-assign a case | `hasCollectionsPermission` |
| Assign others | `admin`/`owner` + `hasCollectionsPermission` |
| Add notes | Assigned user or `hasCollectionsPermission` |
| Change stage manually | `hasCollectionsPermission` |
| Resolve a case | `hasCollectionsPermission` |
| Configure stages/rules/SLAs | `admin` or `owner` |
| Grant collections permission | `admin` or `owner` |

Syndicate users with `hasCollectionsPermission` see only cases for deals they have syndication positions in.

## Settings UI

Both `/settings/collections` and `/collections/settings` render the same config. Four tabs:

**Stages**: Drag-to-reorder list, color picker, name, default/terminal toggles, add/delete.

**Escalation Rules**: Table of rules (trigger type, from/to stage, condition, active toggle). Add/edit/delete with form.

**SLA Thresholds**: Per-stage thresholds (metric, threshold in hours/days). Global resolution time threshold.

**Agencies**: List of external collections agencies. Add/edit/deactivate. Fields: name, contact name, email, phone, notes. Active toggle.

## Resolution Outcomes
- Paid in Full
- Settled (partial payment agreement)
- Payment Plan Arranged
- Defaulted (officially written off as default)
- Written Off (loss accepted)
- Sent to Agency (handed off to external collections agency — records which agency)

## External Collections Agencies

Teams can configure multiple external collections agencies in settings. When resolving a case with "Sent to Agency" outcome:
1. User selects from the team's configured agencies
2. The `agencyId` is recorded on the case
3. The case moves to a terminal stage and is closed
4. This is a hand-off — no further tracking in the system

## Merchant-Level Collections Visibility

The merchant detail page (`/merchants/[id]`) gets a new "Collections" section showing:
- Count of active collections cases for this merchant's deals
- History of past collections cases with outcomes
- Agencies deals were sent to (if any)
- Overall collections risk indicator (e.g., "2 of 5 deals in collections")
