import { DatabaseClient, DrizzleDB } from '@/db';
import { APIKeyRepository } from '@/db-repository/api-key-repository';
import { UserRepository } from '@/db-repository/user-repository';
import { createDefaultPreferences, UserPreferences, UserRole } from '@/db/schema/users';
import { cleanupTestContext, setupTestContext, TestContext } from '@/test-util/test-context';
import { env } from 'cloudflare:test';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('UserRepository Tests', () => {
    let repository: UserRepository;
    let apiKeyRepository: APIKeyRepository;
    let db: DatabaseClient;
    let drizzleDb: DrizzleDB;
    let testCtx: TestContext;

    beforeAll(async () => {
        db = new DatabaseClient(env.DB);
        drizzleDb = db.getDb();
        repository = new UserRepository(drizzleDb);
        apiKeyRepository = new APIKeyRepository(drizzleDb);

        try {
            // Setup test context
            testCtx = await setupTestContext(db);
        } catch (error) {
            console.error('Test setup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        await cleanupTestContext(testCtx, db);
    });

    describe('Create Operations', () => {
        it('should create a new user with basic fields', async () => {
            const newUser = {
                email: `test-${Date.now()}@example.com`,
                name: 'Test User',
                passwordHash: '',
            };

            const result = await repository.create(newUser);

            expect(result).toBeDefined();
            expect(result.email).toBe(newUser.email);
            expect(result.name).toBe(newUser.name);
            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);

            // Clean up created user
            await repository.delete(result.id);
        });

        it('should handle duplicate email creation', async () => {
            const newUser = {
                email: testCtx.user.email, // Use existing email
                name: 'Test User',
                passwordHash: '',
            };

            await expect(repository.create(newUser)).rejects.toThrow();
        });
    });

    describe('Read Operations', () => {
        it('should retrieve a user by ID', async () => {
            const result = await repository.getById(testCtx.user.id);

            expect(result).toBeDefined();
            expect(result?.id).toBe(testCtx.user.id);
            expect(result?.email).toBe(testCtx.user.email);
        });

        it('should return null for non-existent ID', async () => {
            const result = await repository.getById(99999);
            expect(result).toBeNull();
        });

        it('should retrieve a user by email', async () => {
            const result = await repository.getByEmail(testCtx.user.email);

            expect(result).toBeDefined();
            expect(result?.id).toBe(testCtx.user.id);
            expect(result?.email).toBe(testCtx.user.email);
        });

        it('should find users with pagination', async () => {
            const results = await repository.findAll(10, 0);

            expect(results).toBeInstanceOf(Array);
            expect(results.length).toBeGreaterThan(0);
            expect(results.length).toBeLessThanOrEqual(10);
        });
        it('should search users by name or email', async () => {
            const results = await repository.findByNameOrEmail(testCtx.user.name || '');

            expect(results).toBeInstanceOf(Array);
            expect(results.some(user => user.id === testCtx.user.id)).toBeTruthy();
        });
    });


    describe('Update Operations', () => {
        it('should update basic user fields', async () => {
            const updates = {
                name: 'Updated Name',
                bio: 'Financial Platform Developer',
                phoneNumber: '+1234567890',
                role: 'developer' as UserRole,
            };

            const result = await repository.update(testCtx.user.id, updates);

            expect(result).toBeDefined();
            expect(result?.name).toBe(updates.name);
            expect(result?.bio).toBe(updates.bio);
            expect(result?.role).toBe(updates.role);

            // Reset user data
            await repository.update(testCtx.user.id, { name: testCtx.user.name });
        });
    });

    // describe('Update Operations', () => {
    //     it('should update basic user fields', async () => {
    //         const updates = {
    //             name: 'Updated Name',
    //             bio: 'Financial Platform Developer',
    //             phoneNumber: '+1234567890',
    //             role: 'developer' as UserRole,
    //         };

    //         const result = await repository.update(testCtx.user.id, updates);

    //         expect(result).toBeDefined();
    //         expect(result?.name).toBe(updates.name);
    //         expect(result?.bio).toBe(updates.bio);
    //         expect(result?.role).toBe(updates.role);

    //         // Reset user data
    //         await repository.update(testCtx.user.id, { name: testCtx.user.name });
    //     });

    //     describe('Service Tier Updates', () => {
    //         it('should update to growth tier with appropriate limits', async () => {
    //             const preferencesData: UserPreferences = {
    //                 serviceTier: 'growth',
    //                 complianceLevel: 'standard',
    //                 maxRequestsPerSecond: 100,
    //                 maxTransactionsPerDay: 10000,
    //                 maxAccountsPerUser: 1000,
    //                 sandboxMode: true,
    //                 emailNotifications: {
    //                     apiKeyExpiration: true,
    //                     quotaAlerts: true,
    //                     securityAlerts: true,
    //                     complianceUpdates: true,
    //                     transactionAlerts: {
    //                         threshold: 5000,
    //                         enabled: true,
    //                     },
    //                 },
    //             };

    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: preferencesData
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences).toEqual(preferencesData);
    //             expect(result?.preferences?.serviceTier).toBe('growth');
    //             expect(result?.preferences?.maxRequestsPerSecond).toBe(100);
    //         });

    //         it('should update to enterprise tier with enhanced compliance', async () => {
    //             const preferencesData: UserPreferences = {
    //                 serviceTier: 'enterprise',
    //                 complianceLevel: 'enhanced',
    //                 maxRequestsPerSecond: 1000,
    //                 maxTransactionsPerDay: 100000,
    //                 maxAccountsPerUser: 10000,
    //                 sandboxMode: false,
    //                 auditLogRetention: 90,
    //                 dataRetentionPeriod: 365,
    //                 mfaEnabled: true,
    //             };

    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: preferencesData
    //             });
    //             expect(result).toBeDefined();
    //             expect(result?.preferences?.serviceTier).toBe('enterprise');
    //             expect(result?.preferences?.complianceLevel).toBe('enhanced');
    //             expect(result?.preferences?.mfaEnabled).toBe(true);
    //         });
    //     });

    //     describe('API and Webhook Settings', () => {
    //         it('should update webhook configuration', async () => {
    //             const preferencesData: Partial<UserPreferences> = {
    //                 webhookUrl: 'https://api.example.com/webhooks',
    //                 webhookEvents: [
    //                     'transaction.created',
    //                     'payment.processed',
    //                     'kyc.verified'
    //                 ],
    //                 defaultApiVersion: '2024-01',
    //             };
    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: preferencesData as UserPreferences
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences?.webhookUrl).toBe(preferencesData.webhookUrl);
    //             expect(result?.preferences?.webhookEvents).toEqual(preferencesData.webhookEvents);
    //             expect(result?.preferences?.defaultApiVersion).toBe(preferencesData.defaultApiVersion);
    //         });

    //         it('should update transaction limits', async () => {
    //             const preferencesData: Partial<UserPreferences> = {
    //                 transactionLimits: {
    //                     daily: 50000,
    //                     monthly: 1000000,
    //                     perTransaction: 10000
    //                 },
    //                 supportedCurrencies: ['USD', 'EUR', 'GBP'],
    //                 defaultCurrency: 'USD'
    //             };

    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: preferencesData as UserPreferences
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences?.transactionLimits).toEqual(preferencesData.transactionLimits);
    //             expect(result?.preferences?.supportedCurrencies).toEqual(preferencesData.supportedCurrencies);
    //         });
    //     });

    //     describe('Compliance and Security', () => {
    //         it('should update compliance settings', async () => {
    //             const preferencesData: Partial<UserPreferences> = {
    //                 complianceLevel: 'enhanced',
    //                 ipWhitelist: ['192.168.1.1', '10.0.0.1'],
    //                 mfaEnabled: true,
    //                 auditLogRetention: 90,
    //                 dataRetentionPeriod: 365
    //             };

    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: preferencesData as UserPreferences
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences?.complianceLevel).toBe('enhanced');
    //             expect(result?.preferences?.ipWhitelist).toEqual(preferencesData.ipWhitelist);
    //             expect(result?.preferences?.mfaEnabled).toBe(true);
    //         });
    //     });

    //     describe('Error Handling', () => {
    //         it('should reject invalid service tier', async () => {
    //             const invalidPreferences = {
    //                 serviceTier: 'invalid_tier',
    //                 complianceLevel: 'basic'
    //             };
    //             await expect(repository.update(testCtx.user.id, {
    //                 preferences: invalidPreferences as UserPreferences
    //             })).rejects.toThrow();
    //         });

    //         it('should reject invalid transaction limits', async () => {
    //             const invalidPreferences: Partial<UserPreferences> = {
    //                 transactionLimits: {
    //                     daily: -1000, // negative value
    //                     monthly: 'invalid' as any
    //                 }
    //             };
    //             await expect(repository.update(testCtx.user.id, {
    //                 preferences: invalidPreferences as UserPreferences
    //             })).rejects.toThrow();
    //         });

    //         it('should reject invalid webhook events', async () => {
    //             const invalidPreferences: Partial<UserPreferences> = {
    //                 webhookEvents: ['invalid.event' as any, 'another.invalid']
    //             };
    //             await expect(repository.update(testCtx.user.id, {
    //                 preferences: invalidPreferences as UserPreferences
    //             })).rejects.toThrow();
    //         });
    //     });

    //     describe('Reset Operations', () => {
    //         it('should reset to default preferences for tier', async () => {
    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: createDefaultPreferences('starter')
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences?.serviceTier).toBe('starter');
    //             expect(result?.preferences?.maxRequestsPerSecond).toBe(10);
    //             expect(result?.preferences?.complianceLevel).toBe('basic');
    //         });

    //         it('should handle null preferences reset', async () => {
    //             const result = await repository.update(testCtx.user.id, {
    //                 preferences: null
    //             });

    //             expect(result).toBeDefined();
    //             expect(result?.preferences).toBeNull();
    //         });
    //     });
    // });

    describe('Delete Operations', () => {
        it('should delete user and associated API keys', async () => {
            // Create a new test context for deletion test
            const deleteTestCtx = await setupTestContext(db);

            // Verify API keys exist
            expect(Object.values(deleteTestCtx.apiKeys).filter(k => k !== null).length).toBeGreaterThan(0);

            // Delete the user
            const result = await repository.delete(deleteTestCtx.user.id);
            expect(result).toBeTruthy();

            // Verify user is deleted
            const deletedUser = await repository.getById(deleteTestCtx.user.id);
            expect(deletedUser).toBeNull();

            // Verify API keys are deleted
            for (const key of Object.values(deleteTestCtx.apiKeys)) {
                if (key?.id) {
                    const apiKey = await apiKeyRepository.getById(key.id);
                    expect(apiKey).toBeNull();
                }
            }
        });

        it('should return false when deleting non-existent user', async () => {
            const result = await repository.delete(99999);
            expect(result).toBeFalsy();
        });
    });

    describe('Dependent Records', () => {
        it('should detect API key dependencies', async () => {
            const hasRecords = await repository.hasDependentRecords(testCtx.user.id);
            expect(hasRecords).toBeTruthy();
        });

        it('should handle users without API keys', async () => {
            // Create a user without API keys
            const user = await repository.create({
                email: `test-${Date.now()}@example.com`,
                name: 'Test User',
                passwordHash: '',
            });

            const hasRecords = await repository.hasDependentRecords(user.id);
            expect(hasRecords).toBeFalsy();

            await repository.delete(user.id);
        });

        it('should verify all API keys are deleted with user', async () => {
            // Create a new test context
            const verifyTestCtx = await setupTestContext(db);

            // Count initial API keys
            const initialApiKeys = Object.values(verifyTestCtx.apiKeys).filter(k => k !== null).length;
            expect(initialApiKeys).toBeGreaterThan(0);

            // Delete user
            await repository.delete(verifyTestCtx.user.id);

            // Verify all API keys are deleted
            const remainingKeys = await apiKeyRepository.getByUserId(verifyTestCtx.user.id);
            expect(remainingKeys).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Create a user with invalid data
            const invalidUser = {
                email: null as any, // This should trigger a database error
                name: 'Test User',
                passwordHash: '',
            };

            await expect(repository.create(invalidUser)).rejects.toThrow();
        });

        it('should handle deletion errors', async () => {
            // Attempt to delete a user that doesn't exist
            const result = await repository.delete(999999);
            expect(result).toBeFalsy();
        });
    });
});