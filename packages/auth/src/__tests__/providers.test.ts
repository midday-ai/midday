import { expect, test } from "bun:test";
import { getEnabledSocialProviders } from "../providers";

test("social providers require both configured credentials", () => {
  const keys = ["GOOGLE", "GITHUB", "APPLE", "MICROSOFT"].flatMap(
    (provider) => [
      `AUTH_${provider}_CLIENT_ID`,
      `AUTH_${provider}_CLIENT_SECRET`,
    ],
  );
  const saved = new Map(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    expect(getEnabledSocialProviders()).toEqual([]);
    process.env.AUTH_GOOGLE_CLIENT_ID = "local-client";
    expect(getEnabledSocialProviders()).toEqual([]);
    process.env.AUTH_GOOGLE_CLIENT_SECRET = "local-test";
    expect(getEnabledSocialProviders()).toEqual(["google"]);
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
