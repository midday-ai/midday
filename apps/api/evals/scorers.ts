/**
 * Scorers for chat tool selection evals
 *
 * Deterministic — no LLM cost.
 */
import { createScorer } from "evalite";
import type { ToolSelectionFixture } from "./fixtures";

type ToolSelectionOutput = string[];

/**
 * Fraction of expected tools that appear in activeTools.
 * 1.0 = all expected tools selected, 0.0 = none selected.
 */
export const expectedToolsPresent = createScorer<
  ToolSelectionFixture,
  ToolSelectionOutput
>({
  name: "Expected tools present",
  description:
    "Fraction of expected tools found in the selected activeTools set",
  scorer: ({ input, output, expected }) => {
    const expectedTools: string[] = expected ?? input.expected;
    if (expectedTools.length === 0) return 1;

    const selected = new Set(output);
    const found = expectedTools.filter((t) => selected.has(t));
    const score = found.length / expectedTools.length;
    const missing = expectedTools.filter((t) => !selected.has(t));

    return {
      score,
      metadata: {
        expected: expectedTools,
        found,
        missing,
        totalSelected: output.length,
      },
    };
  },
});

/**
 * Binary pass/fail — 1 if ALL expected tools are present, 0 if any missing.
 */
export const noToolsMissing = createScorer<
  ToolSelectionFixture,
  ToolSelectionOutput
>({
  name: "No tools missing",
  description: "1 if every expected tool was selected, 0 otherwise",
  scorer: ({ input, output, expected }) => {
    const expectedTools: string[] = expected ?? input.expected;
    if (expectedTools.length === 0) return 1;

    const selected = new Set(output);
    const allPresent = expectedTools.every((t) => selected.has(t));

    return allPresent ? 1 : 0;
  },
});

/**
 * Precision — fraction of selected tools that belong to an acceptable domain.
 *
 * Uses `acceptablePrefixes` from the fixture. If not provided, falls back to
 * prefixes derived from the expected tool names (everything up to and
 * including the second underscore, e.g. "invoices_create" → "invoices_").
 *
 * A score of 1.0 means every selected tool is in the right domain.
 * Lower scores indicate noise (irrelevant tools polluting the selection).
 */
export const selectionPrecision = createScorer<
  ToolSelectionFixture,
  ToolSelectionOutput
>({
  name: "Selection precision",
  description:
    "Fraction of selected tools whose name matches an acceptable domain prefix",
  scorer: ({ input, output }) => {
    if (output.length === 0) return 1;

    const prefixes = input.acceptablePrefixes ?? [
      ...new Set(
        input.expected.map((t) => {
          const idx = t.indexOf("_");
          return idx !== -1 ? t.slice(0, idx + 1) : t;
        }),
      ),
    ];

    const acceptable = output.filter((tool) =>
      prefixes.some((p) => tool.startsWith(p)),
    );
    const noisy = output.filter(
      (tool) => !prefixes.some((p) => tool.startsWith(p)),
    );

    return {
      score: acceptable.length / output.length,
      metadata: {
        acceptablePrefixes: prefixes,
        acceptable,
        noisy,
        totalSelected: output.length,
      },
    };
  },
});
