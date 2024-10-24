import { DatabaseClient, DrizzleDB } from '@/db';
import { APIKeyRepository } from '@/db-repository/api-key-repository';
import { APIKey } from '@/db/schema/api-keys';
import { cleanupTestContext, setupTestContext, TestContext } from 'test/test-util/test-context';
import { APIKeyGenerator } from 'test/test-util/utils/api-key-generator';
import { env } from 'cloudflare:test';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('APIKeyRepository Integration Tests', () => {
    let repository: APIKeyRepository;
    let db: DatabaseClient;
    let drizzleDb: DrizzleDB;
    let mockApiKey: APIKey;
    let testCtx: TestContext;

    beforeAll(async () => {
        db = new DatabaseClient(env.DB);
        drizzleDb = db.getDb();
        repository = new APIKeyRepository(drizzleDb);

        try {
            testCtx = await setupTestContext(db);
        } catch (error) {
            console.error('Setup failed:', error);
            throw error;
        }
    });
    beforeEach(() => {
        var apiKey = APIKeyGenerator.generate({
            userId: testCtx.user.id,
        });

        mockApiKey = {
            ...apiKey,
            id: Math.floor(Math.random() * 1000) + 1,
            createdAt: new Date(), // Adding a mock createdAt
        };
    });

    afterAll(async () => {
        await cleanupTestContext(testCtx, db);
    });

    describe('Basic CRUD Operations', () => {
        describe('create', () => {
            it('should create a new API key with basic fields', async () => {
                const input = {
                    ...mockApiKey,
                    userId: testCtx.user.id,
                };
                const { id, createdAt, ...inputWithoutIdAndCreatedAt } = input;

                const result = await repository.create(inputWithoutIdAndCreatedAt);

                expect(result).toBeDefined();
                expect(result.keyId).toEqual(mockApiKey.keyId);
                expect(result.userId).toEqual(testCtx.user.id);
                expect(result.createdAt).toBeInstanceOf(Date);

                await repository.delete(result.id);
            });

            it('should create API key with array fields', async () => {
                const input = APIKeyGenerator.generate({
                    userId: testCtx.user.id,
                    scope: ['read', 'write'],
                    allowedIPs: ['192.168.1.1', '10.0.0.1'],
                    allowedDomains: ['example.com', 'test.com'],
                });

                const result = await repository.create(input);

                expect(result.scope).toEqual(['read', 'write']);
                expect(result.allowedIPs).toEqual(['192.168.1.1', '10.0.0.1']);
                expect(result.allowedDomains).toEqual(['example.com', 'test.com']);

                await repository.delete(result.id);
            });
        });

        describe('read operations', () => {
            it('should retrieve an API key by ID', async () => {
                const result = await repository.getById(testCtx.apiKeys.created!.id);

                expect(result).toBeDefined();
                expect(result?.id).toEqual(testCtx.apiKeys.created!.id);
            });

            it('should return null for non-existent ID', async () => {
                const result = await repository.getById(99999);
                expect(result).toBeNull();
            });

            it('should retrieve all API keys for a user', async () => {
                const results = await repository.getByUserId(testCtx.user.id);

                expect(results.length).toBeGreaterThan(0);
                expect(results.some(key => key.id === testCtx.apiKeys.created!.id)).toBeTruthy();
            });
        });

        describe('update operations', () => {
            it('should update basic fields', async () => {
                const newName = 'Updated Key Name';
                const result = await repository.update(testCtx.apiKeys.created!.id, {
                    name: newName,
                });

                expect(result?.name).toEqual(newName);
            });

            it('should update array fields', async () => {
                const updates: Partial<APIKey> = {
                    scope: ['read', 'write', 'admin'],
                    allowedIPs: ['192.168.1.2'],
                    allowedDomains: ['new-domain.com'],
                };

                const result = await repository.update(testCtx.apiKeys.created!.id, updates);

                expect(result?.scope).toEqual(updates.scope);
                expect(result?.allowedIPs).toEqual(updates.allowedIPs);
                expect(result?.allowedDomains).toEqual(updates.allowedDomains);
            });
        });
    });

    describe('Relationship Tests', () => {
        it('should not create API key for non-existent user', async () => {
            const input = APIKeyGenerator.generate({
                userId: 99999,
            });

            await expect(repository.create(input))
                .rejects
                .toThrow(/FOREIGN KEY constraint failed/);
        });
    });

    describe('Transaction Tests', () => {
        it('should rollback all operations on error', async () => {
            const initialKeys = await repository.getByUserId(testCtx.user.id);

            try {
                await db.executeTransaction(async (tx) => {
                    // Create first key (succeeds)
                    await repository.create(APIKeyGenerator.generate({ userId: testCtx.user.id }));

                    // Create second key (fails - invalid user)
                    await repository.create(APIKeyGenerator.generate({ userId: 99999 }));
                });
            } catch (error) {
                // Expected to fail
            }

            const finalKeys = await repository.getByUserId(testCtx.user.id);
            expect(finalKeys.length).toEqual(initialKeys.length);
        });
    });

    describe('Error Cases', () => {
        it('should handle invalid scope values', async () => {
            const input = APIKeyGenerator.generate({
                userId: testCtx.user.id,
                scope: ['invalid' as any],
            });

            await expect(repository.create(input)).rejects.toThrow('Validation failed: Invalid scope array');
        });

        it('should handle invalid IP addresses', async () => {
            const input = APIKeyGenerator.generate({
                userId: testCtx.user.id,
                allowedIPs: ['invalid-ip'],
            });

            await expect(repository.create(input)).rejects.toThrow('Validation failed: Invalid IP addresses array');
        });

        it('should validate boolean fields', async () => {
            const input = APIKeyGenerator.generate({
                userId: testCtx.user.id,
                revoked: 'not-a-boolean' as any,
            });

            await expect(repository.create(input)).rejects.toThrow(/Validation failed/);
        });
    });

    describe('Business Logic Tests', () => {
        describe('getActiveKeysByUserId', () => {
            it('should only return active and non-revoked keys', async () => {
                const results = await repository.getActiveKeysByUserId(testCtx.user.id);

                expect(results.some(key => key.id === testCtx.apiKeys.active!.id)).toBeTruthy();
                expect(results.some(key => key.id === testCtx.apiKeys.revoked!.id)).toBeFalsy();
            });
        });

        describe('incrementUsage', () => {
            it('should properly increment usage count', async () => {
                const initialUsage = testCtx.apiKeys.created!.usageCount;
                const ip = '192.168.1.1';

                const result = await repository.incrementUsage(testCtx.apiKeys.created!.id, ip);

                expect(result?.usageCount).toEqual(initialUsage + 1);
                expect(result?.lastUsedIP).toEqual(ip);
                expect(result?.lastUsedAt).toBeInstanceOf(Date);
            });
        });

        describe('revokeKey', () => {
            it('should properly revoke an active key', async () => {
                const key = await repository.create(APIKeyGenerator.generate({
                    userId: testCtx.user.id,
                    isActive: true,
                }));

                const reason = 'Security concern';
                const result = await repository.revokeKey(key.id, reason);

                expect(result?.revoked).toBeTruthy();
                expect(result?.isActive).toBeFalsy();
                expect(result?.revokedReason).toEqual(reason);
                expect(result?.revokedAt).toBeInstanceOf(Date);

                await repository.delete(key.id);
            });
        });

        describe('getExpiringKeys', () => {
            it('should identify soon-to-expire keys', async () => {
                // Create a key that will expire in 5 days
                const fiveDaysFromNow = new Date();
                fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

                const expiringKey = await repository.create(
                    APIKeyGenerator.generate({
                        userId: testCtx.user.id,
                        expiresAt: fiveDaysFromNow
                    })
                );

                const results = await repository.getExpiringKeys(7);
                const foundKey = results.find(k => k.id === expiringKey.id);

                expect(foundKey).toBeDefined();

                // Clean up
                await repository.delete(expiringKey.id);
            });

            it('should not include already expired keys', async () => {
                const results = await repository.getExpiringKeys(7);
                const expiredKey = results.find(k => k.id === testCtx.apiKeys.expired!.id);
                expect(expiredKey).toBeUndefined();
            });
        });

        describe('getHighUsageKeys', () => {
            it('should identify keys with high usage', async () => {
                const threshold = testCtx.apiKeys.highUsage!.usageCount - 1;
                const results = await repository.getHighUsageKeys(threshold);

                const foundKey = results.find(key => key.id === testCtx.apiKeys.highUsage!.id);
                expect(foundKey).toBeDefined();
            });
        });
    });

    describe('Validation Tests', () => {
        it('should validate required fields', async () => {
            const invalidInput = {
                userId: testCtx.user.id,
                // Missing required fields
            };

            await expect(repository.create(invalidInput as any)).rejects.toThrow();
        });

        it('should validate date fields', async () => {
            const input = APIKeyGenerator.generate({
                userId: testCtx.user.id,
            });

            const invalidInput = {
                ...input,
                expiresAt: 'invalid-date',
            };

            await expect(repository.create(invalidInput as any)).rejects.toThrow();
        });

        it('should validate boolean fields', async () => {
            const input = APIKeyGenerator.generate({
                userId: testCtx.user.id,
                isActive: 'not-a-boolean' as any,
            });

            await expect(repository.create(input)).rejects.toThrow();
        });
    });
});
