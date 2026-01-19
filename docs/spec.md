# Sprint Planning Template

This template provides a structured approach for planning development sprints on Abacus. Every sprint should result in **demoable software**.

---

## How to Use This Template

1. Copy the template section below into a new file (e.g., `docs/sprints/sprint-001.md`)
2. Fill in each section
3. Review with the `writing-plans` skill before starting
4. Execute tasks sequentially
5. After completion, run `code-reviewer` agent for review

---

## Sprint Goal

**Goal**: [One sentence describing the demoable outcome]

**Demo**: [How will you demonstrate this works?]

---

## Task Breakdown

### Task 1: [Title]

**Description**: [What needs to be done]

**Validation**:
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]

**Files**:
- `path/to/file.ts` — [what changes]
- `path/to/another.ts` — [what changes]

---

### Task 2: [Title]

**Description**: [What needs to be done]

**Validation**:
- [ ] [Specific, testable criterion]
- [ ] [Another criterion]

**Files**:
- `path/to/file.ts` — [what changes]

---

### Task 3: [Title]

**Description**: [What needs to be done]

**Validation**:
- [ ] [Specific, testable criterion]

**Files**:
- `path/to/file.ts` — [what changes]

---

## Task Format Rules

Each task MUST be:

| Requirement | Description |
|-------------|-------------|
| **Atomic** | Single, focused unit of work that does one thing |
| **Commitable** | Can be committed independently without breaking the build |
| **Testable** | Has clear validation criteria (tests, manual verification, or both) |

### Good Task Examples
- "Add risk score column to merchant table"
- "Create API endpoint for fetching merchant payments"
- "Implement NSF alert notification"

### Bad Task Examples
- "Improve the dashboard" (too vague)
- "Refactor everything" (not atomic)
- "Add features" (no validation criteria)

---

## Validation Requirements

Every task must have at least one validation criterion. Types of validation:

| Type | When to Use | Example |
|------|-------------|---------|
| **Automated Test** | Logic, calculations, API endpoints | "Unit test passes for risk score calculation" |
| **Manual Test** | UI interactions, visual changes | "Clicking 'Export' downloads CSV with correct data" |
| **Build Check** | Type safety, compilation | "TypeScript compiles without errors" |
| **Visual Check** | Styling, layout | "Risk badge displays correctly in merchant row" |

---

## Review Process

After completing all tasks:

1. **Self-Review**: Verify all validation criteria are met
2. **Code Review**: Use the `code-reviewer` agent
   ```
   Use superpowers:code-reviewer to review this sprint implementation
   ```
3. **Address Feedback**: Fix any issues identified
4. **Commit**: Create atomic commits per task (or squash if appropriate)

---

## Example Sprint

### Sprint Goal

**Goal**: Add risk scoring to the merchant list view

**Demo**: Open the merchant list, see risk scores displayed as colored badges (green/yellow/red), click to sort by risk

---

### Task 1: Add risk_score column to merchants table

**Description**: Add a nullable `risk_score` integer column (0-100) to the merchants table in Supabase

**Validation**:
- [ ] Migration applies successfully
- [ ] Column appears in Supabase table view
- [ ] TypeScript types regenerated and include risk_score

**Files**:
- `supabase/migrations/YYYYMMDD_add_risk_score.sql` — new migration
- `packages/supabase/src/types.ts` — regenerated types

---

### Task 2: Create risk score calculation function

**Description**: Implement a function that calculates risk score based on payment consistency, NSF count, and days since last payment

**Validation**:
- [ ] Function returns 0-100 integer
- [ ] Unit tests pass for edge cases (new merchant, no payments, high NSF)
- [ ] TypeScript compiles without errors

**Files**:
- `apps/dashboard/src/lib/risk-scoring.ts` — new file with calculation logic
- `apps/dashboard/src/lib/risk-scoring.test.ts` — unit tests

---

### Task 3: Display risk badge in merchant table

**Description**: Add a visual risk badge component that shows risk level with color coding

**Validation**:
- [ ] Badge displays in merchant table row
- [ ] Colors match: green (80-100), yellow (50-79), red (0-49)
- [ ] Tooltip shows exact score on hover

**Files**:
- `packages/ui/src/components/risk-badge.tsx` — new component
- `apps/dashboard/src/components/merchant-table.tsx` — integrate badge

---

### Task 4: Enable sorting by risk score

**Description**: Add risk_score as a sortable column in the merchant table

**Validation**:
- [ ] Clicking risk column header sorts ascending/descending
- [ ] Sort indicator shows current sort direction
- [ ] Null scores sort to end

**Files**:
- `apps/dashboard/src/components/merchant-table.tsx` — add sort handler

---

## Notes

- No timeline estimates — focus on what, not when
- If a task is too large, split it into smaller atomic tasks
- If validation criteria are unclear, clarify before starting
- Reference `CLAUDE.md` for design standards and coding patterns
