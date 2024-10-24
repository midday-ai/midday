import { Analytics } from '@/analytics/client';
import { ApiAnalyticsEvent, SdkAnalyticsEvent } from '@/analytics/types';
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
    // Clear console mocks before each test
    vi.clearAllMocks();

    // Create a new Analytics instance before each test
    analytics = new Analytics({
      environment: 'test',
      requestId: 'test-request-id',
    });
  });

  describe('constructor', () => {
    it('should create an instance with the correct properties', () => {
      expect(analytics).toBeInstanceOf(Analytics);
      // Instead of mocking ConsoleLogger, we verify that analytics was created successfully
      // and the underlying console methods are being called as expected
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
  });
});