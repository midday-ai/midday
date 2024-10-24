import { newId, prefixes } from '@/analytics';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('newId', () => {
    // Mock crypto.getRandomValues
    const mockRandomValues = vi.fn();
    const originalCrypto = (globalThis as any).crypto;

    beforeEach(() => {
        // Setup crypto mock
        (globalThis as any).crypto = {
            getRandomValues: mockRandomValues
        };
    });

    afterEach(() => {
        // Restore original crypto
        (global as any).crypto = originalCrypto;
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should generate IDs with correct prefix', () => {
        // Mock random values
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(0);
            return arr;
        });

        // Test each prefix
        const testCases: Array<keyof typeof prefixes> = [
            'key',
            'policy',
            'api',
            'request',
            'workspace',
            'keyAuth',
            'vercelBinding',
            'role',
            'test',
            'auditLog',
            'ratelimitNamespace',
            'ratelimitOverride',
            'permission',
            'secret',
            'headerRewrite',
            'gateway',
            'llmGateway',
            'webhook',
            'event',
            'reporter',
            'webhookDelivery',
            'identity',
            'ratelimit'
        ];

        testCases.forEach(prefix => {
            const id = newId(prefix);
            expect(id.startsWith(`${prefixes[prefix]}_`)).toBe(true);
        });
    });

    it('should generate chronologically sortable IDs', () => {
        // Mock random values to be consistent
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(0);
            return arr;
        });

        // Use fake timers
        vi.useFakeTimers();

        // Generate IDs at different times
        const time1 = new Date('2024-01-01T00:00:00Z').getTime();
        const time2 = new Date('2024-01-01T00:00:01Z').getTime();

        vi.setSystemTime(time1);
        const id1 = newId('test');

        vi.setSystemTime(time2);
        const id2 = newId('test');

        // IDs should be in chronological order
        expect(id1 < id2).toBe(true);
    });

    it('should use custom epoch correctly', () => {
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(0);
            return arr;
        });

        vi.useFakeTimers();

        // Test with a known time
        const testTime = new Date('2023-11-14T22:13:20.000Z').getTime();
        vi.setSystemTime(testTime);

        const id = newId('test');

        // The encoded timestamp should be very close to 0 at the epoch
        const encodedPart = id.split('_')[1];
        expect(encodedPart.startsWith('1')).toBe(true); // First character should indicate near-zero timestamp
    });

    it('should generate unique IDs even with same timestamp', () => {
        // Mock crypto to generate different random values each time
        let counter = 0;
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(counter++);
            return arr;
        });

        vi.useFakeTimers();
        const fixedTime = new Date('2024-01-01T00:00:00Z').getTime();
        vi.setSystemTime(fixedTime);

        const id1 = newId('test');
        const id2 = newId('test');

        expect(id1).not.toEqual(id2);
    });

    it('should generate URL-safe IDs', () => {
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(255); // Use max values to test encoding
            return arr;
        });

        const id = newId('test');

        // Check for URL-safe characters
        expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
        expect(id).not.toContain('+');
        expect(id).not.toContain('/');
        expect(id).not.toContain('=');
    });

    it('should handle maximum timestamp values', () => {
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(0);
            return arr;
        });

        vi.useFakeTimers();

        // Test with a far future date
        const farFuture = new Date('2159-12-22T04:41:36.000Z').getTime();
        vi.setSystemTime(farFuture);

        // Should still generate valid ID without throwing
        expect(() => newId('test')).not.toThrow();
    });

    it('should maintain consistent length for random parts', () => {
        const generateWithValue = (value: number) => {
            mockRandomValues.mockImplementation((arr: Uint8Array) => {
                arr.fill(value);
                return arr;
            });
            return newId('test');
        };

        // Test with different random values
        const id1 = generateWithValue(0);
        const id2 = generateWithValue(255);

        // Base part (after prefix) should have same length
        const base1 = id1.split('_')[1];
        const base2 = id2.split('_')[1];
        expect(base1.length).toEqual(base2.length);
    });

    it('should handle concurrent ID generation', async () => {
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(Math.random() * 256);
            return arr;
        });

        // Generate multiple IDs concurrently
        const ids = await Promise.all(
            Array.from({ length: 1000 }, () => Promise.resolve(newId('test')))
        );

        // Check for uniqueness
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate valid IDs across the entire timestamp range', () => {
        mockRandomValues.mockImplementation((arr: Uint8Array) => {
            arr.fill(0);
            return arr;
        });

        vi.useFakeTimers();

        // Test at different points in time
        const testDates = [
            '2023-11-14T22:13:20.000Z', // Epoch start
            '2024-01-01T00:00:00.000Z', // Near epoch
            '2050-01-01T00:00:00.000Z', // Mid-range
            '2159-12-22T04:41:35.999Z'  // Near max
        ];

        testDates.forEach(dateStr => {
            vi.setSystemTime(new Date(dateStr));
            const id = newId('test');
            expect(id).toMatch(/^test_[1-9A-Za-z]+$/);
        });
    });
});