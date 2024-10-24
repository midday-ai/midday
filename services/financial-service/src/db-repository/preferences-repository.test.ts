import { DatabaseClient, DrizzleDB } from '@/db';
import { PreferencesRepository } from '@/db-repository/preferences-repository';
import { UserRepository } from '@/db-repository/user-repository';
import { ComplianceLevel, ServiceTier } from '@/db/schema/preferences';
import { User } from '@/db/schema/users';
import { cleanupTestContext, setupTestContext, TestContext } from '@/test-util/test-context';
import { env } from 'cloudflare:test';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('PreferencesRepository Tests', () => {
    let repository: PreferencesRepository;
    let userRepository: UserRepository;
    let db: DatabaseClient;
    let drizzleDb: DrizzleDB;
    let testCtx: TestContext;
    let testUser: User;

    beforeAll(async () => {
        db = new DatabaseClient(env.DB);
        drizzleDb = db.getDb();
        repository = new PreferencesRepository(drizzleDb);
        userRepository = new UserRepository(drizzleDb);

        try {
            testCtx = await setupTestContext(db);
        } catch (error) {
            console.error('Test setup failed:', error);
            throw error;
        }
    });

    afterAll(async () => {
        await cleanupTestContext(testCtx, db);
    });

    beforeEach(async () => {
        // Create a new user for each test
        userRepository = new UserRepository(db.getDb());
        testUser = await userRepository.create({
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            name: 'Test User',
            passwordHash: ''
        });
    });

    afterEach(async () => {
        // Clean up test user and their preferences
        if (testUser?.id) {
            await repository.deleteByUserId(testUser.id);
            await userRepository.delete(testUser.id);
        }
    });

    describe('Create Operations', () => {
        it('should create preferences with basic fields', async () => {
            const newPrefs = {
                userId: testCtx.user.id,
                serviceTier: 'starter' as ServiceTier,
                complianceLevel: 'basic' as ComplianceLevel,
                maxRequestsPerSecond: 10,
                maxTransactionsPerDay: 1000,
                maxAccountsPerUser: 5,
            };

            const result = await repository.create(newPrefs);

            expect(result).toBeDefined();
            expect(result.userId).toBe(newPrefs.userId);
            expect(result.serviceTier).toBe(newPrefs.serviceTier);
            expect(result.maxRequestsPerSecond).toBe(newPrefs.maxRequestsPerSecond);
            expect(result.createdAt).toBeInstanceOf(Date);

            // Clean up created preferences
            await repository.delete(result.id);
        });

        it('should handle duplicate user preferences creation', async () => {
            const newPrefs = {
                userId: testCtx.user.id,
                serviceTier: 'starter' as ServiceTier,
                complianceLevel: 'basic' as ComplianceLevel,
            };

            // Create first preferences
            await repository.create(newPrefs);

            // Attempt to create duplicate preferences
            await expect(repository.create(newPrefs)).rejects.toThrow();

            // Clean up
            const prefs = await repository.getByUserId(testCtx.user.id);
            if (prefs) {
                await repository.delete(prefs.id);
            }
        });

        it('should handle non-existent user ID', async () => {
            const newPrefs = {
                userId: 99999,
                serviceTier: 'starter' as ServiceTier,
                complianceLevel: 'basic' as ComplianceLevel,
            };

            await expect(repository.create(newPrefs)).rejects.toThrow();
        });
    });

    describe('Read Operations', () => {
        let testPrefs: Awaited<ReturnType<typeof repository.create>>;

        beforeAll(async () => {
            testPrefs = await repository.create({
                userId: testCtx.user.id,
                serviceTier: 'starter',
                complianceLevel: 'basic',
            });
        });

        afterAll(async () => {
            if (testPrefs) {
                await repository.delete(testPrefs.id);
            }
        });

        it('should retrieve preferences by ID', async () => {
            const result = await repository.getById(testPrefs.id);

            expect(result).toBeDefined();
            expect(result?.id).toBe(testPrefs.id);
            expect(result?.userId).toBe(testPrefs.userId);
        });

        it('should return null for non-existent ID', async () => {
            const result = await repository.getById(99999);
            expect(result).toBeNull();
        });

        it('should retrieve preferences by user ID', async () => {
            const result = await repository.getByUserId(testCtx.user.id);

            expect(result).toBeDefined();
            expect(result?.userId).toBe(testCtx.user.id);
            expect(result?.serviceTier).toBe(testPrefs.serviceTier);
        });
    });

    describe('Update Operations', () => {
        let testPrefs: Awaited<ReturnType<typeof repository.create>>;
        let testUser: User;

        beforeEach(async () => {
            testUser = await userRepository.create({
                email: `test-${Date.now()}-${Math.random()}@example.com`,
                name: 'Test User',
                passwordHash: ''
            });
        });

        afterEach(async () => {
            if (testUser?.id) {
                await repository.deleteByUserId(testUser.id);
                await userRepository.delete(testUser.id);
            }
        });
        
        beforeAll(async () => {
            testPrefs = await repository.create({
                userId: testCtx.user.id,
                serviceTier: 'starter',
                complianceLevel: 'basic',
            });
        });

        afterAll(async () => {
            if (testPrefs) {
                await repository.delete(testPrefs.id);
            }
        });

        it('should update basic preference fields', async () => {
            const updates = {
                maxRequestsPerSecond: 20,
                maxTransactionsPerDay: 2000,
                maxAccountsPerUser: 10,
                emailNotificationApiKey: true,
                emailNotificationSecurity: true,
            };

            const result = await repository.update(testPrefs.id, updates);

            expect(result).toBeDefined();
            expect(result.maxRequestsPerSecond).toBe(updates.maxRequestsPerSecond);
            expect(result.maxTransactionsPerDay).toBe(updates.maxTransactionsPerDay);
            expect(result.emailNotificationApiKey).toBe(updates.emailNotificationApiKey);
        });

        it('should update service tier settings', async () => {
            const result = await repository.upgradeServiceTier(testCtx.user.id, 'growth');

            expect(result).toBeDefined();
            expect(result.serviceTier).toBe('growth');
            expect(result.maxRequestsPerSecond).toBe(100);
            expect(result.maxTransactionsPerDay).toBe(10000);
            expect(result.complianceLevel).toBe('standard');
        });

        // it('should preserve custom settings during tier upgrade', async () => {
        //     // Create initial preferences with custom settings
        //     const prefs = await repository.create({
        //         userId: testUser.id,
        //         serviceTier: 'starter',
        //         complianceLevel: 'basic',
        //         webhookUrl: 'https://example.com/webhook',
        //         webhookEvents: ['transaction.created', 'payment.processed'],
        //         ipWhitelist: ['192.168.1.1']
        //     });

        //     // Verify initial settings
        //     expect(prefs.webhookEvents).toEqual(['transaction.created', 'payment.processed']);
        //     expect(prefs.ipWhitelist).toEqual(['192.168.1.1']);

        //     // Upgrade to enterprise
        //     const upgraded = await repository.upgradeServiceTier(testUser.id, 'enterprise');

        //     // Verify upgraded settings
        //     expect(upgraded.serviceTier).toBe('enterprise');
        //     expect(upgraded.webhookUrl).toBe(prefs.webhookUrl);
        //     expect(upgraded.webhookEvents).toEqual(prefs.webhookEvents);
        //     expect(upgraded.ipWhitelist).toEqual(prefs.ipWhitelist);
        //     expect(upgraded.maxRequestsPerSecond).toBe(1000);
        // });

        it('should update basic preference fields', async () => {
            // Create initial preferences
            const initialPrefs = await repository.create({
                userId: testUser.id,
                serviceTier: 'starter',
                complianceLevel: 'basic'
            });

            // Update preferences
            const updates = {
                maxRequestsPerSecond: 20,
                maxTransactionsPerDay: 2000,
                maxAccountsPerUser: 10,
                emailNotificationApiKey: true,
                emailNotificationSecurity: true,
            };

            const result = await repository.update(initialPrefs.id, updates);

            // Verify updates
            expect(result).toBeDefined();
            expect(result.maxRequestsPerSecond).toBe(updates.maxRequestsPerSecond);
            expect(result.maxTransactionsPerDay).toBe(updates.maxTransactionsPerDay);
            expect(result.emailNotificationApiKey).toBe(updates.emailNotificationApiKey);
        });

        it('should update service tier settings', async () => {
            // Create initial preferences
            const initialPrefs = await repository.create({
                userId: testUser.id,
                serviceTier: 'starter',
                complianceLevel: 'basic'
            });

            // Upgrade to growth tier
            const result = await repository.upgradeServiceTier(testUser.id, 'growth');

            // Verify tier upgrade
            expect(result).toBeDefined();
            expect(result.serviceTier).toBe('growth');
            expect(result.maxRequestsPerSecond).toBe(100);
            expect(result.maxTransactionsPerDay).toBe(10000);
            expect(result.complianceLevel).toBe('standard');
        });
    });

    describe('Delete Operations', () => {
        it('should delete preferences', async () => {
            const prefs = await repository.create({
                userId: testCtx.user.id,
                serviceTier: 'starter',
                complianceLevel: 'basic',
            });

            const result = await repository.delete(prefs.id);
            expect(result).toBeTruthy();

            const deleted = await repository.getById(prefs.id);
            expect(deleted).toBeNull();
        });

        it('should handle deleting non-existent preferences', async () => {
            const result = await repository.delete(99999);
            expect(result).toBeFalsy();
        });
    });

    describe('Service Tier Operations', () => {
        it('should get users by service tier', async () => {
            // Create test users with different tiers
            const user1 = await userRepository.create({
                email: `test-${Date.now()}-1@example.com`,
                name: 'Test User 1',
                passwordHash: ''
            });

            const user2 = await userRepository.create({
                email: `test-${Date.now()}-2@example.com`,
                name: 'Test User 2',
                passwordHash: ''
            });

            await repository.create({
                userId: user1.id,
                serviceTier: 'growth',
                complianceLevel: 'standard',
            });

            await repository.create({
                userId: user2.id,
                serviceTier: 'growth',
                complianceLevel: 'standard',
            });

            const results = await repository.getUsersByServiceTier('growth');
            expect(results).toContain(user1.id);
            expect(results).toContain(user2.id);

            // Clean up
            await repository.deleteByUserId(user1.id);
            await repository.deleteByUserId(user2.id);
            await userRepository.delete(user1.id);
            await userRepository.delete(user2.id);
        });
    });

    describe('Error Handling', () => {
        describe('Service Tier Validation', () => {
            it('should reject invalid service tier during creation', async () => {
                await expect(repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'invalid_tier' as ServiceTier,
                    complianceLevel: 'basic',
                })).rejects.toThrow('Invalid service tier: invalid_tier');
            });

            it('should reject invalid service tier during update', async () => {
                const prefs = await repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                await expect(repository.update(prefs.id, {
                    serviceTier: 'premium' as ServiceTier,
                })).rejects.toThrow('Invalid service tier: premium');

                await repository.delete(prefs.id);
            });
        });

        describe('Rate Limits Validation', () => {
            it('should reject negative rate limits', async () => {
                const prefs = await repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                await expect(repository.update(prefs.id, {
                    maxRequestsPerSecond: -10,
                })).rejects.toThrow('Invalid rate limit: maxRequestsPerSecond cannot be negative');

                await repository.delete(prefs.id);
            });

            it('should reject rate limits exceeding tier maximum', async () => {
                const prefs = await repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                await expect(repository.update(prefs.id, {
                    maxRequestsPerSecond: 2000,
                })).rejects.toThrow('Rate limit exceeds tier maximum for starter tier');

                await repository.delete(prefs.id);
            });
        });

        describe('Webhook Configuration Validation', () => {
            it('should reject invalid webhook URLs', async () => {
                const prefs = await repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                await expect(repository.update(prefs.id, {
                    webhookUrl: 'not-a-valid-url',
                })).rejects.toThrow('Invalid webhook URL: must be a valid HTTP(S) URL');

                await repository.delete(prefs.id);
            });

            it('should reject invalid webhook events', async () => {
                const prefs = await repository.create({
                    userId: testCtx.user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                await expect(repository.update(prefs.id, {
                    webhookEvents: ['invalid.event', 'another.invalid'] as any,
                })).rejects.toThrow('Invalid webhook event type');

                await repository.delete(prefs.id);
            });
        });

        describe('User Reference Integrity', () => {
            it('should reject creation for non-existent user', async () => {
                await expect(repository.create({
                    userId: 99999,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                })).rejects.toThrow('User with ID 99999 not found');
            });

            it('should handle user deletion cascade', async () => {
                // Create a test user and preferences
                const user = await userRepository.create({
                    email: `test-${Date.now()}@example.com`,
                    name: 'Test User',
                    passwordHash: '',
                });

                await repository.create({
                    userId: user.id,
                    serviceTier: 'starter',
                    complianceLevel: 'basic',
                });

                // Delete preferences first (due to foreign key constraint)
                await repository.deleteByUserId(user.id);

                // Then delete the user
                await userRepository.delete(user.id);

                // Verify preferences were deleted
                const prefs = await repository.getByUserId(user.id);
                expect(prefs).toBeNull();
            });
        });
    });
});