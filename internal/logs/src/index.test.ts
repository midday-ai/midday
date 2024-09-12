import { describe, expect, it, vi } from "vitest";

import { Log, logContext, logSchema, LogSchema } from "./index"; // Adjust the import path as needed

// Mock the metricSchema if it's not available in the test environment
vi.mock("@internal/metrics", () => ({
  metricSchema: {
    parse: vi.fn((metric) => metric), // This mock just returns the input
  },
}));

describe("logContext", () => {
  it("should validate a valid log context", () => {
    const validContext = { requestId: "123456" };
    expect(() => logContext.parse(validContext)).not.toThrow();
  });

  it("should throw on invalid log context", () => {
    const invalidContext = { requestId: 123 }; // should be string
    expect(() => logContext.parse(invalidContext)).toThrow();
  });
});

describe("logSchema", () => {
  describe("log type", () => {
    it("should validate a valid log entry", () => {
      const validLog: LogSchema = {
        type: "log",
        level: "info",
        requestId: "123456",
        time: Date.now(),
        message: "Test log message",
        context: { someKey: "someValue" },
        environment: "production",
        application: "api",
      };
      expect(() => logSchema.parse(validLog)).not.toThrow();
    });

    it("should throw on invalid log entry", () => {
      const invalidLog = {
        type: "log",
        level: "invalid-level", // Invalid level
        requestId: "123456",
        time: "not-a-number", // Should be number
        message: 123, // Should be string
        context: { someKey: "someValue" },
        environment: "production",
        application: "api",
      };
      expect(() => logSchema.parse(invalidLog)).toThrow();
    });
  });

  describe("metric type", () => {
    it("should throw on invalid metric entry", () => {
      const invalidMetric = {
        type: "metric",
        requestId: "123456",
        time: Date.now(),
        metric: {
          // Invalid metric type
          metric: "invalid.metric",
          value: 100,
        },
        environment: "production",
        application: "api",
      };
      expect(() => logSchema.parse(invalidMetric)).toThrow();
    });
  });

  it("should throw on unknown type", () => {
    const unknownType = {
      type: "unknown",
      requestId: "123456",
      time: Date.now(),
      environment: "production",
      application: "api",
    };
    expect(() => logSchema.parse(unknownType)).toThrow();
  });

  it("should throw on invalid environment", () => {
    const invalidEnvironment: LogSchema = {
      type: "log",
      level: "info",
      requestId: "123456",
      time: Date.now(),
      message: "Test log message",
      context: {},
      environment: "invalid" as any, // TypeScript will complain, but we want to test runtime behavior
      application: "api",
    };
    expect(() => logSchema.parse(invalidEnvironment)).toThrow();
  });

  it("should throw on invalid application", () => {
    const invalidApplication: LogSchema = {
      type: "log",
      level: "info",
      requestId: "123456",
      time: Date.now(),
      message: "Test log message",
      context: {},
      environment: "production",
      application: "invalid" as any, // TypeScript will complain, but we want to test runtime behavior
    };
    expect(() => logSchema.parse(invalidApplication)).toThrow();
  });
});

describe("Log class", () => {
  it("should create a Log instance", () => {
    const logData: LogSchema = {
      type: "log",
      level: "info",
      requestId: "123456",
      time: Date.now(),
      message: "Test log message",
      context: {},
      environment: "production",
      application: "api",
    };
    const log = new Log(logData);
    expect(log.log).toEqual(logData);
  });

  it("should convert to string correctly", () => {
    const logData: LogSchema = {
      type: "log",
      level: "info",
      requestId: "123456",
      time: 1629123456789,
      message: "Test log message",
      context: {},
      environment: "production",
      application: "api",
    };
    const log = new Log(logData);
    expect(log.toString()).toBe(JSON.stringify(logData));
  });
});
