import { describe, expect, test } from "vitest";

import { and, or, type PermissionQuery } from "./queries";

describe("serialising the schema", () => {
  const testCases: {
    name: string;
    input: PermissionQuery;
    output: PermissionQuery;
  }[] = [
    {
      name: "Simple role check",
      input: "admin",
      output: "admin",
    },
    {
      name: "Multiple roles with 'and'",
      input: and("admin", "user"),
      output: { and: ["admin", "user"] },
    },
    {
      name: "Multiple roles with 'or'",
      input: or("admin", "user"),
      output: { or: ["admin", "user"] },
    },
    {
      name: "Nested 'and' and 'or'",
      input: and("admin", or("user", "guest")),
      output: { and: ["admin", { or: ["user", "guest"] }] },
    },
    {
      name: "Complex nesting with 'and' and 'or'",
      input: and("admin", or("user", and("guest", "moderator"))),
      output: {
        and: ["admin", { or: ["user", { and: ["guest", "moderator"] }] }],
      },
    },

    {
      name: "Multiple levels of 'and'",
      input: and("admin", and("user", "guest")),
      output: { and: ["admin", { and: ["user", "guest"] }] },
    },

    {
      name: "Multiple levels of 'or'",
      input: or("admin", or("user", "guest")),
      output: { or: ["admin", { or: ["user", "guest"] }] },
    },
    {
      name: "Mix of 'and' and 'or' at different levels",
      input: or("admin", and("user", or("guest", "moderator"))),
      output: {
        or: ["admin", { and: ["user", { or: ["guest", "moderator"] }] }],
      },
    },

    {
      name: "Deep nesting of 'and' and 'or'",
      input: and("admin", or("user", and("guest", or("moderator", "editor")))),
      output: {
        and: [
          "admin",
          { or: ["user", { and: ["guest", { or: ["moderator", "editor"] }] }] },
        ],
      },
    },
    {
      name: "Complex combination of 'and' and 'or' at different levels",
      input: or(
        and("admin", or("user", and("guest", "moderator"))),
        and("editor", "viewer"),
      ),
      output: {
        or: [
          { and: ["admin", { or: ["user", { and: ["guest", "moderator"] }] }] },
          { and: ["editor", "viewer"] },
        ],
      },
    },
  ];

  for (const { name, input, output } of testCases) {
    test(name, () => {
      expect(input).toEqual(output);
    });
  }
});
