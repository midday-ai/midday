// logger.test.ts

import { Logger } from "./logger";

describe("Logger", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleDebugSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation();
    consoleDebugSpy = jest.spyOn(console, "debug").mockImplementation();
    Logger.setLevel("INFO"); // Reset to default log level before each test
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("setLevel", () => {
    it("should set the log level correctly", () => {
      Logger.setLevel("DEBUG");
      Logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe("error", () => {
    it("should log error messages", () => {
      Logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR] Error message"),
      );
    });

    it("should include error stack in metadata", () => {
      const error = new Error("Test error");
      Logger.error("Error occurred", error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error occurred"),
      );

      const callArgument = consoleErrorSpy.mock.calls[0][0];
      const metadataMatch = callArgument.match(/\{[\s\S]*\}/);

      if (metadataMatch) {
        const metadata = JSON.parse(metadataMatch[0]);
        expect(metadata.error).toContain("Error: Test error");
        expect(metadata.error).toContain("at Object.<anonymous>");
      } else {
        fail("Metadata not found in log output");
      }
    });
  });

  describe("warn", () => {
    it("should log warn messages", () => {
      Logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("[WARN] Warning message"),
      );
    });
  });

  describe("info", () => {
    it("should log info messages", () => {
      Logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO] Info message"),
      );
    });
  });

  describe("debug", () => {
    it("should not log debug messages when level is INFO", () => {
      Logger.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should log debug messages when level is DEBUG", () => {
      Logger.setLevel("DEBUG");
      Logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG] Debug message"),
      );
    });
  });

  describe("log level behavior", () => {
    it("should log all levels when set to DEBUG", () => {
      Logger.setLevel("DEBUG");
      Logger.debug("Debug message");
      Logger.info("Info message");
      Logger.warn("Warn message");
      Logger.error("Error message");
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should not log DEBUG when set to INFO", () => {
      Logger.setLevel("INFO");
      Logger.debug("Debug message");
      Logger.info("Info message");
      Logger.warn("Warn message");
      Logger.error("Error message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("metadata handling", () => {
    it("should include metadata in log message", () => {
      const metadata = { userId: 123, action: "login" };
      Logger.info("User action", metadata);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(metadata, null, 2)),
      );
    });
  });

  describe("timestamp", () => {
    it("should include ISO timestamp in log message", () => {
      Logger.info("Test message");
      const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/;
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(isoDateRegex),
      );
    });
  });
});
