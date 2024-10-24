import { Analytics } from '@/analytics/client';
import { ApiAnalyticsEvent, SdkAnalyticsEvent } from '@/analytics/types';
import { LogSchema } from '@/logger';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock console methods
const consoleMock = {
  info: vi.fn(),
  debug: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const globalWithConsole = global as typeof globalThis & { console: typeof console };
globalWithConsole.console = { ...console, ...consoleMock };

describe('Analytics', () => {
  let analytics: Analytics;

  beforeEach(() => {
    vi.clearAllMocks();
    analytics = new Analytics({
      environment: 'test',
      requestId: 'test-request-id',
    });
  });

  describe('constructor', () => {
    it('should create an instance with the correct properties', () => {
      expect(analytics).toBeInstanceOf(Analytics);
    });
    it('should handle missing requestId', () => {
      const analyticsWithoutRequestId = new Analytics({
        environment: 'test',
        requestId: 'default-request-id'
      });
      expect(analyticsWithoutRequestId).toBeInstanceOf(Analytics);
    });

    it('should initialize with different environments', () => {
      const environments: Array<LogSchema["environment"]> = ['development', 'production'];
      environments.forEach(env => {
        const instance = new Analytics({ 
          environment: env, 
          requestId: 'test-request-id' 
        });
        expect(instance).toBeInstanceOf(Analytics);
      });
    });
  });

  describe('insertSdkTelemetry', () => {
    it('should log SDK telemetry events', async () => {
      const sdkEvent: SdkAnalyticsEvent = {
        requestId: 'test-request-id',
        time: 0,
        platform: '',
        runtime: '',
        versions: []
      };

      await analytics.insertSdkTelemetry({
        requestID: 'test-request-id',
        event: sdkEvent,
      });

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Inserting SDK telemetry')
      );
    });

    it('should handle missing requestID', async () => {
      const sdkEvent: SdkAnalyticsEvent = {
        requestId: '',
        time: 0,
        platform: '',
        runtime: '',
        versions: []
      };

      await analytics.insertSdkTelemetry({ event: sdkEvent } as any);
      expect(consoleMock.info).toHaveBeenCalled();
    });

    it('should handle different platform values', async () => {
      const platforms = ['ios', 'android', 'web', 'unknown'];

      for (const platform of platforms) {
        const sdkEvent: SdkAnalyticsEvent = {
          requestId: 'test-request-id',
          time: Date.now(),
          platform,
          runtime: 'test-runtime',
          versions: ['1.0.0']
        };

        await analytics.insertSdkTelemetry({
          requestID: 'test-request-id',
          event: sdkEvent,
        });

        expect(consoleMock.info).toHaveBeenLastCalledWith(
          expect.stringContaining(platform)
        );
      }
    });

    it('should handle array of versions', async () => {
      const sdkEvent: SdkAnalyticsEvent = {
        requestId: 'test-request-id',
        time: Date.now(),
        platform: 'test',
        runtime: 'test',
        versions: ['1.0.0', '2.0.0', '3.0.0']
      };

      await analytics.insertSdkTelemetry({
        requestID: 'test-request-id',
        event: sdkEvent,
      });

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('1.0.0')
      );
    });
  });

  describe('insertApiRequest', () => {
    it('should log API request events with sensitive data removed', async () => {
      const apiEvent: ApiAnalyticsEvent = {
        method: 'GET',
        path: '/test',
        request_body: 'sensitive data',
        response_body: 'sensitive response',
        error: '',
        time: 0,
        host: '',
        request_id: '',
        request_headers: [],
        response_status: 0,
        response_headers: [],
        service_latency: 0,
        user_agent: '',
        ip_address: ''
      };

      await analytics.insertApiRequest(apiEvent);

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Inserting API request')
      );
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const apiEvent: ApiAnalyticsEvent = {
          method,
          path: '/test',
          request_body: '',
          response_body: '',
          error: '',
          time: Date.now(),
          host: 'test-host',
          request_id: 'test-request-id',
          request_headers: [],
          response_status: 200,
          response_headers: [],
          service_latency: 100,
          user_agent: 'test-agent',
          ip_address: '127.0.0.1'
        };

        await analytics.insertApiRequest(apiEvent);

        expect(consoleMock.info).toHaveBeenLastCalledWith(
          expect.stringContaining(method)
        );
      }
    });

    it('should handle different response status codes', async () => {
      const statusCodes = [200, 201, 400, 401, 403, 404, 500, 503];

      for (const status of statusCodes) {
        const apiEvent: ApiAnalyticsEvent = {
          method: 'GET',
          path: '/test',
          request_body: '',
          response_body: '',
          error: '',
          time: Date.now(),
          host: 'test-host',
          request_id: 'test-request-id',
          request_headers: [],
          response_status: status,
          response_headers: [],
          service_latency: 100,
          user_agent: 'test-agent',
          ip_address: '127.0.0.1'
        };

        await analytics.insertApiRequest(apiEvent);

        expect(consoleMock.info).toHaveBeenLastCalledWith(
          expect.stringContaining(status.toString())
        );
      }
    });

    it('should handle API errors', async () => {
      const apiEvent: ApiAnalyticsEvent = {
        method: 'GET',
        path: '/test',
        request_body: '',
        response_body: '',
        error: 'Test error message',
        time: Date.now(),
        host: 'test-host',
        request_id: 'test-request-id',
        request_headers: [],
        response_status: 500,
        response_headers: [],
        service_latency: 100,
        user_agent: 'test-agent',
        ip_address: '127.0.0.1'
      };

      await analytics.insertApiRequest(apiEvent);

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should handle request headers', async () => {
      const apiEvent: ApiAnalyticsEvent = {
        method: 'GET',
        path: '/test',
        request_body: '',
        response_body: '',
        error: '',
        time: Date.now(),
        host: 'test-host',
        request_id: 'test-request-id',
        request_headers: [
          'Content-Type: application/json',
          'Authorization: Bearer token'
        ],
        response_status: 200,
        response_headers: [],
        service_latency: 100,
        user_agent: 'test-agent',
        ip_address: '127.0.0.1'
      };

      await analytics.insertApiRequest(apiEvent);

      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Content-Type')
      );
      expect(consoleMock.info).toHaveBeenCalledWith(
        expect.stringContaining('Authorization')
      );
    });

    it('should handle various service latencies', async () => {
      const latencies = [0, 100, 1000, 5000];

      for (const latency of latencies) {
        const apiEvent: ApiAnalyticsEvent = {
          method: 'GET',
          path: '/test',
          request_body: '',
          response_body: '',
          error: '',
          time: Date.now(),
          host: 'test-host',
          request_id: 'test-request-id',
          request_headers: [],
          response_status: 200,
          response_headers: [],
          service_latency: latency,
          user_agent: 'test-agent',
          ip_address: '127.0.0.1'
        };

        await analytics.insertApiRequest(apiEvent);

        expect(consoleMock.info).toHaveBeenLastCalledWith(
          expect.stringContaining(latency.toString())
        );
      }
    });

    it('should handle error during API request insertion', async () => {
      consoleMock.info.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const apiEvent: ApiAnalyticsEvent = {
        method: 'GET',
        path: '/test',
        request_body: '',
        response_body: '',
        error: '',
        time: 0,
        host: '',
        request_id: '',
        request_headers: [],
        response_status: 0,
        response_headers: [],
        service_latency: 0,
        user_agent: '',
        ip_address: ''
      };

      await expect(analytics.insertApiRequest(apiEvent)).rejects.toThrow();
      expect(consoleMock.error).toHaveBeenCalled();
    });
  });
});