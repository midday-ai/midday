import { describe, expect, test } from "vitest";

import { buildQuery, type PermissionQuery } from "./queries";
import { RBAC } from "./rbac";

describe("evaluating a query", () => {
  const testCases: {
    name: string;
    query: PermissionQuery;
    permissions: string[];
    valid: boolean;
  }[] = [
    {
      name: "Simple role check (Pass)",
      query: buildQuery(() => "admin"),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Simple role check (Fail)",
      query: buildQuery(() => "developer"),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "'and' of two permissions (Pass)",
      query: buildQuery(({ and }) => and("admin", "user")),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "'and' of two permissions (Fail)",
      query: buildQuery(({ and }) => and("admin", "developer")),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "'or' of two permissions (Pass)",
      query: buildQuery(({ or }) => or("admin", "developer")),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "or' of two permissions (Fail)",
      query: buildQuery(({ or }) => or("developer", "guest")),
      permissions: ["admin", "user", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "and' and 'or' combination (Pass)",
      query: buildQuery(({ and, or }) => and("admin", or("user", "guest"))),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "'and' and 'or' combination (Fail)",
      query: buildQuery(({ and, or }) =>
        and("admin", or("developer", "editor")),
      ),
      permissions: ["user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "Deep nesting of 'and'(Pass)",
      query: buildQuery(({ and }) =>
        and("admin", and("user", and("guest", "moderator"))),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Deep nesting of 'and' (Fail)",
      query: buildQuery(({ and }) => and("admin", and("developer", "guest"))),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "Deep nesting of 'or'(Pass)",
      query: buildQuery(({ or }) =>
        or("admin", or("user", or("guest", "moderator"))),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Deep nesting of 'or' (Fail)",
      query: buildQuery(({ or }) => or("developer", or("editor", "viewer"))),
      permissions: ["admin", "user", "guest", "moderator"],
      valid: false,
    },
    {
      name: "Complex combination of 'and' and 'or'(Pass)",
      query: buildQuery(({ and, or }) =>
        or(and("admin", "user"), and("guest", "moderator")),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Complex combination of 'and' and 'or' (Fail)",
      query: buildQuery(({ and, or }) =>
        or(and("admin", "developer"), and("editor", "viewer")),
      ),
      permissions: ["admin", "user", "guest", "moderator", "viewer"],
      valid: false,
    },
    {
      name: "Multiple levels of nesting(Pass)",
      query: buildQuery(({ and, or }) =>
        or(and("admin", or("user", and("guest", "moderator"))), "editor"),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Multiple levels of nesting (Fail)",
      query: buildQuery(({ and, or }) =>
        or(and("admin", or("developer", and("guest", "moderator"))), "viewer"),
      ),
      permissions: ["user", "guest", "moderator", "editor"],
      valid: false,
    },
    {
      name: "Complex combination of 'and' and 'or' at different levels (Pass)",
      query: buildQuery(({ and, or }) =>
        or(
          and("admin", or("user", and("guest", "moderator"))),
          and("editor", "viewer"),
        ),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Complex combination of 'and' and 'or' at different levels (Fail)",
      query: buildQuery(({ and, or }) =>
        or(
          and("admin", or("developer", and("guest", "moderator"))),
          and("editor", "developer"),
        ),
      ),
      permissions: ["user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
    {
      name: "Deep nesting of 'and' and 'or'(Pass)",
      query: buildQuery(({ and, or }) =>
        and("admin", or("user", and("guest", or("moderator", "editor")))),
      ),
      permissions: ["admin", "user", "guest", "moderator", "editor", "viewer"],
      valid: true,
    },
    {
      name: "Deep nesting of 'and' and 'or' (Fail)",
      query: buildQuery(({ and, or }) =>
        and("admin", or("developer", and("guest", or("moderator", "editor")))),
      ),
      permissions: ["user", "guest", "moderator", "editor", "viewer"],
      valid: false,
    },
  ];

  for (const tc of testCases) {
    test(tc.name, () => {
      const res = new RBAC().evaluatePermissions(tc.query, tc.permissions);
      expect(res.err).toBeUndefined();
      expect(res.val!.valid).toBe(tc.valid);
    });
  }
});

describe("bad queries", () => {
  test("catch empty {}", () => {
    const res = new RBAC().validateQuery({
      or: [
        "*",
        "api.*.read_key",
        // @ts-expect-error
        {},
      ],
    });
    expect(res.err).toBeDefined();
    expect(res.err!.message).toMatchInlineSnapshot(`
      "[
        {
          "code": "invalid_union",
          "unionErrors": [
            {
              "issues": [
                {
                  "code": "invalid_type",
                  "expected": "string",
                  "received": "object",
                  "path": [],
                  "message": "Expected string, received object"
                }
              ],
              "name": "ZodError"
            },
            {
              "issues": [
                {
                  "code": "invalid_type",
                  "expected": "array",
                  "received": "undefined",
                  "path": [
                    "and"
                  ],
                  "message": "Required"
                }
              ],
              "name": "ZodError"
            },
            {
              "issues": [
                {
                  "code": "invalid_union",
                  "unionErrors": [
                    {
                      "issues": [
                        {
                          "code": "invalid_type",
                          "expected": "string",
                          "received": "object",
                          "path": [
                            "or",
                            2
                          ],
                          "message": "Expected string, received object"
                        }
                      ],
                      "name": "ZodError"
                    },
                    {
                      "issues": [
                        {
                          "code": "invalid_type",
                          "expected": "array",
                          "received": "undefined",
                          "path": [
                            "or",
                            2,
                            "and"
                          ],
                          "message": "Required"
                        }
                      ],
                      "name": "ZodError"
                    },
                    {
                      "issues": [
                        {
                          "code": "invalid_type",
                          "expected": "array",
                          "received": "undefined",
                          "path": [
                            "or",
                            2,
                            "or"
                          ],
                          "message": "Required"
                        }
                      ],
                      "name": "ZodError"
                    }
                  ],
                  "path": [
                    "or",
                    2
                  ],
                  "message": "Invalid input"
                }
              ],
              "name": "ZodError"
            }
          ],
          "path": [],
          "message": "Invalid input"
        }
      ]"
    `);
  });
});
