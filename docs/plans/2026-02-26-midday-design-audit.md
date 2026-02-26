# Midday Design Alignment Audit

## Context

Abacus is forked from [Midday AI](https://github.com/midday-ai/midday) and repurposed for MCA (Merchant Cash Advance) portfolio management. After multiple agent-driven development sessions, the UI components may have drifted from Midday's design patterns. This audit ensures alignment.

**Source of truth:** Midday's `main` branch at `https://github.com/midday-ai/midday`

## Scope

### Category 1: Direct Midday Components (exact match required)

Shared UI primitives in `packages/ui/src/components/` that exist in both repos. These should be identical to Midday's current versions:

- Core: `badge.tsx`, `button.tsx`, `card.tsx`, `table.tsx`, `input.tsx`
- Overlays: `dialog.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`, `sheet.tsx`
- Forms: `form.tsx`, `checkbox.tsx`, `select.tsx`, `textarea.tsx`
- Display: `avatar.tsx`, `skeleton.tsx`, `spinner.tsx`, `progress.tsx`, `tabs.tsx`
- Layout: `separator.tsx`, `collapsible.tsx`
- All other shared primitives (~77 components total)

### Category 2: MCA-Specific Components (convention match required)

Abacus-only components that must follow Midday's established conventions:

- `deal-status-badge.tsx`, `disclosure-status-badge.tsx`, `match-status-badge.tsx`
- `animated-status.tsx`, `connection-status.tsx`
- `invoice-status.tsx`, `order-status.tsx`
- Broker portal components
- Collections module components
- MCA-specific data tables

### Category 3: Dashboard App Components

Page-level components in `apps/dashboard/` that compose the UI primitives:

- Sidebar navigation
- Page layouts
- Data table implementations
- Status display in context

## Audit Dimensions

For each component, compare:

| Dimension | Description |
|-----------|-------------|
| Capitalization | Uppercase, lowercase, Title Case - match Midday exactly |
| Color usage | Exact hex values, semantic tokens, variant colors |
| Variant names | CVA variant definitions, naming conventions |
| Spacing/sizing | Padding, margins, border-radius, gaps |
| Typography | Font weight, size, line-height, font-family |
| Animation | Transition patterns, duration, easing |
| Dark mode | `dark:` variant support |
| Accessibility | ARIA attributes, Radix UI primitives |

## Execution Strategy

### Phase 1: Baseline Capture

Fetch Midday's current `packages/ui/src/components/` from GitHub main branch. For each shared component, capture full source code, variant definitions, color values, text patterns, and spacing.

### Phase 2: Side-by-Side Comparison

Diff each Abacus component against its Midday counterpart. Flag deviations by severity:

- **Critical**: Wrong capitalization, wrong colors, missing/changed variants, broken behavior
- **Moderate**: Different spacing, missing dark mode, changed border-radius, font changes
- **Minor**: Comment differences, import order, code style

### Phase 3: Convention Extraction

From the Midday baseline, extract conventions for MCA-specific components:

- Badge text capitalization pattern
- Badge color semantic mapping
- Table styling conventions
- Status indicator patterns (dot + text, colored bg, border-only, etc.)

### Phase 4: MCA Component Convention Audit

Apply extracted conventions to all MCA-specific components. Flag deviations.

### Phase 5: Visual Verification

Use Playwright to screenshot key pages and verify overall look-and-feel matches Midday's aesthetic.

### Phase 6: Fix Plan

Produce a prioritized fix list:

1. Critical fixes (wrong appearance/behavior)
2. Moderate fixes (polish and consistency)
3. Minor fixes (code quality alignment)

## Deliverable

A comprehensive findings document with:
- Per-component deviation report
- Convention reference extracted from Midday
- Prioritized implementation plan with specific file changes
