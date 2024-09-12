import { describe, expect, it } from "vitest";

import { Metric, metricSchema } from "./index"; // Adjust the import path as needed

describe("metricSchema", () => {
  describe("metric.cache.read", () => {
    it("should validate a valid cache read metric", () => {
      const validMetric: Metric = {
        metric: "metric.cache.read",
        key: "test-key",
        hit: true,
        status: "fresh",
        latency: 100,
        tier: "memory",
        namespace: "default",
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });

    it("should throw on invalid cache read metric", () => {
      const invalidMetric = {
        metric: "metric.cache.read",
        key: "test-key",
        hit: "not-a-boolean", // Should be boolean
        latency: "100", // Should be number
        tier: "memory",
        namespace: "default",
      };
      expect(() => metricSchema.parse(invalidMetric)).toThrow();
    });
  });

  describe("metric.cache.write", () => {
    it("should validate a valid cache write metric", () => {
      const validMetric: Metric = {
        metric: "metric.cache.write",
        key: "test-key",
        tier: "memory",
        latency: 50,
        namespace: "default",
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });
  });

  describe("metric.cache.remove", () => {
    it("should validate a valid cache remove metric", () => {
      const validMetric: Metric = {
        metric: "metric.cache.remove",
        key: "test-key",
        tier: "memory",
        namespace: "default",
        latency: 30,
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });
  });

  describe("metric.cache.size", () => {
    it("should validate a valid cache size metric", () => {
      const validMetric: Metric = {
        metric: "metric.cache.size",
        tier: "memory",
        size: 1024,
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });

    it("should throw on invalid tier", () => {
      const invalidMetric = {
        metric: "metric.cache.size",
        tier: "disk", // Should be 'memory'
        size: 1024,
      };
      expect(() => metricSchema.parse(invalidMetric)).toThrow();
    });
  });

  describe("metric.fetch.egress", () => {
    it("should validate a valid fetch egress metric", () => {
      const validMetric: Metric = {
        metric: "metric.fetch.egress",
        url: "https://example.com",
        latency: 200,
        status: 200,
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });
  });

  describe("metric.key.verification", () => {
    it("should validate a valid key verification metric", () => {
      const validMetric: Metric = {
        metric: "metric.key.verification",
        valid: true,
        code: "SUCCESS",
        workspaceId: "123",
        apiId: "456",
        keyId: "789",
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });

    it("should validate without optional fields", () => {
      const validMetric: Metric = {
        metric: "metric.key.verification",
        valid: false,
        code: "INVALID",
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });
  });

  describe("metric.http.request", () => {
    it("should validate a valid http request metric", () => {
      const validMetric: Metric = {
        metric: "metric.http.request",
        host: "example.com",
        path: "/api",
        method: "GET",
        status: 200,
        serviceLatency: 100,
        isolateLifetime: 1000,
        isolateId: "123",
        context: { userId: "456" },
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });

    it("should validate with optional fields", () => {
      const validMetric: Metric = {
        metric: "metric.http.request",
        host: "example.com",
        path: "/api",
        method: "GET",
        status: 200,
        serviceLatency: 100,
        isolateLifetime: 1000,
        isolateId: "123",
        context: {},
        colo: "LAX",
        continent: "NA",
        country: "US",
        city: "Los Angeles",
        userAgent: "Mozilla/5.0",
        fromAgent: "CloudFlare",
      };
      expect(() => metricSchema.parse(validMetric)).not.toThrow();
    });
  });

  // Add more test cases for other metric types...

  describe("invalid metrics", () => {
    it("should throw on unknown metric type", () => {
      const invalidMetric = {
        metric: "metric.unknown",
        value: 100,
      };
      expect(() => metricSchema.parse(invalidMetric)).toThrow();
    });

    it("should throw on missing required fields", () => {
      const invalidMetric = {
        metric: "metric.cache.read",
        // Missing required fields
      };
      expect(() => metricSchema.parse(invalidMetric)).toThrow();
    });
  });
});
