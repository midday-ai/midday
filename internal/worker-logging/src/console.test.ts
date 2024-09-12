import { Log } from "@internal/logs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConsoleLogger } from "./console";

// Mock the console methods
console.debug = vi.fn();
console.info = vi.fn();
console.warn = vi.fn();
console.error = vi.fn();

// Mock the Date.now() method
vi.spyOn(Date, "now").mockImplementation(() => 1234567890000);

describe("ConsoleLogger", () => {
  let logger: ConsoleLogger;

  beforeEach(() => {
    logger = new ConsoleLogger({
      requestId: "test-request-id",
      environment: "test",
      application: "api",
      defaultFields: { default: "field" },
    });
    vi.clearAllMocks();
  });

  it("should create a logger with correct initial values", () => {
    expect(logger).toBeInstanceOf(ConsoleLogger);
  });

  it("should log debug messages correctly", () => {
    logger.debug("Debug message", { extra: "field" });
    const loggedMessage = (console.debug as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.level).toBe("debug");
    expect(parsedLog.message).toBe("Debug message");
    expect(parsedLog.context).toEqual({ default: "field", extra: "field" });
  });

  it("should log info messages correctly", () => {
    logger.info("Info message");
    const loggedMessage = (console.info as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.level).toBe("info");
    expect(parsedLog.message).toBe("Info message");
  });

  it("should log warn messages correctly", () => {
    logger.warn("Warn message");
    const loggedMessage = (console.warn as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.level).toBe("warn");
    expect(parsedLog.message).toBe("Warn message");
  });

  it("should log error messages correctly", () => {
    logger.error("Error message");
    const loggedMessage = (console.error as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.level).toBe("error");
    expect(parsedLog.message).toBe("Error message");
  });

  it("should log fatal messages correctly", () => {
    logger.fatal("Fatal message");
    const loggedMessage = (console.error as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.level).toBe("fatal");
    expect(parsedLog.message).toBe("Fatal message");
  });

  it("should include correct metadata in logs", () => {
    logger.info("Test message");
    const loggedMessage = (console.info as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.type).toBe("log");
    expect(parsedLog.environment).toBe("test");
    expect(parsedLog.application).toBe("api");
    expect(parsedLog.requestId).toBe("test-request-id");
    expect(parsedLog.time).toBe(1234567890000);
    expect(parsedLog.level).toBe("info");
    expect(parsedLog.message).toBe("Test message");
    expect(parsedLog.context).toEqual({ default: "field" });
  });

  it("should update requestId when setRequestId is called", () => {
    logger.setRequestId("new-request-id");
    logger.info("Test message");
    const loggedMessage = (console.info as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.requestId).toBe("new-request-id");
  });

  it("should merge defaultFields with provided fields", () => {
    logger.info("Test message", { extra: "field" });
    const loggedMessage = (console.info as jest.Mock).mock.calls[0][0];
    const parsedLog = JSON.parse(loggedMessage);

    expect(parsedLog.context).toEqual({ default: "field", extra: "field" });
  });
});
