import { render } from "@react-email/render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Resend } from "./client";

// Mock the external dependencies
vi.mock("@react-email/render", () => ({
  render: vi.fn(() => "<mocked-html-content>"),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ error: null }),
    },
  })),
}));

describe("Resend", () => {
  let resend: Resend;

  beforeEach(() => {
    resend = new Resend({ apiKey: "test-api-key" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("sendTrialEnded", () => {
    it("should send a trial ended email", async () => {
      await resend.sendTrialEnded({
        email: "test@example.com",
        name: "Test User",
        workspace: "Test Workspace",
      });

      expect(render).toHaveBeenCalled();
      expect(resend.client.emails.send).toHaveBeenCalledWith({
        to: "test@example.com",
        from: "founder@updates.tesseract.dev",
        reply_to: "support@tesseract.dev",
        subject: "Your Tesseract trial has ended",
        html: "<mocked-html-content>",
      });
    });
  });

  describe("sendSubscriptionEnded", () => {
    it("should send a subscription ended email", async () => {
      await resend.sendSubscriptionEnded({
        email: "test@example.com",
        name: "Test User",
      });

      expect(render).toHaveBeenCalled();
      expect(resend.client.emails.send).toHaveBeenCalledWith({
        to: "test@example.com",
        from: "founder@updates.tesseract.dev",
        reply_to: "support@tesseract.dev",
        subject: "Your Tesseract trial has ended",
        html: "<mocked-html-content>",
      });
    });

    // Add error handling test similar to sendTrialEnded
  });

  describe("sendWelcomeEmail", () => {
    it("should send a welcome email", async () => {
      await resend.sendWelcomeEmail({
        email: "test@example.com",
      });

      expect(render).toHaveBeenCalled();
      expect(resend.client.emails.send).toHaveBeenCalledWith({
        to: "test@example.com",
        from: "founder@updates.tesseract.dev",
        reply_to: "support@tesseract.dev",
        subject: "Welcome to Tesseract",
        html: "<mocked-html-content>",
      });
    });

    // Add error handling test
  });

  describe("sendPaymentIssue", () => {
    it("should send a payment issue email", async () => {
      const testDate = new Date("2023-01-01");
      await resend.sendPaymentIssue({
        email: "test@example.com",
        name: "Test User",
        date: testDate,
      });

      expect(render).toHaveBeenCalled();
      expect(resend.client.emails.send).toHaveBeenCalledWith({
        to: "test@example.com",
        from: "founder@updates.tesseract.dev",
        reply_to: "support@tesseract.dev",
        subject: "There was an issue with your payment",
        html: "<mocked-html-content>",
      });
    });

    // Add error handling test
  });

  describe("sendLeakedKeyEmail", () => {
    it("should send a leaked key email", async () => {
      await resend.sendLeakedKeyEmail({
        email: "test@example.com",
        date: "2023-01-01",
        source: "GitHub",
        url: "https://github.com/example/repo",
      });

      expect(render).toHaveBeenCalled();
      expect(resend.client.emails.send).toHaveBeenCalledWith({
        to: "test@example.com",
        from: "founder@updates.tesseract.dev",
        reply_to: "support@tesseract.dev",
        subject: "Tesseract root key exposed in public Github repository",
        html: "<mocked-html-content>",
      });
    });

    // Add error handling test
  });
});
