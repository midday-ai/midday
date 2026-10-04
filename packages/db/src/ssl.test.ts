import { afterEach, describe, expect, test } from "bun:test";
import { getSslConfig } from "./ssl";

const originalSsl = process.env.DATABASE_SSL;
const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalSsl === undefined) delete process.env.DATABASE_SSL;
  else process.env.DATABASE_SSL = originalSsl;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});

describe("getSslConfig", () => {
  test("disable and false disable TLS outside development, ignoring case", () => {
    process.env.NODE_ENV = "production";
    for (const mode of ["disable", "false", "DISABLE", "FALSE"]) {
      process.env.DATABASE_SSL = mode;
      expect(getSslConfig()).toBe(false);
    }
  });

  test("require enables certificate verification even in development", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_SSL = "require";
    expect(getSslConfig()).toEqual({ rejectUnauthorized: true });
  });

  test("no-verify enables TLS without certificate verification", () => {
    process.env.NODE_ENV = "development";
    process.env.DATABASE_SSL = "no-verify";
    expect(getSslConfig()).toEqual({ rejectUnauthorized: false });
  });

  test("unset or unknown modes preserve the development default", () => {
    process.env.NODE_ENV = "development";
    delete process.env.DATABASE_SSL;
    expect(getSslConfig()).toBe(false);
    process.env.DATABASE_SSL = "unknown";
    expect(getSslConfig()).toBe(false);
  });

  test("unset mode preserves TLS outside development", () => {
    delete process.env.DATABASE_SSL;
    for (const mode of ["production", "test"]) {
      process.env.NODE_ENV = mode;
      expect(getSslConfig()).toEqual({ rejectUnauthorized: false });
    }
    delete process.env.NODE_ENV;
    expect(getSslConfig()).toEqual({ rejectUnauthorized: false });
  });
});
