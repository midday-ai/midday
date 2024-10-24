import { APIKey } from '@/db/schema/api-keys';
import { customAlphabet } from 'nanoid';

export type APIKeyEnvironment = 'development' | 'staging' | 'production';
export type APIKeyScope = 'read' | 'write' | 'admin' | 'full';

export interface APIKeyGeneratorOptions {
    id?: number;
    userId?: number;
    name?: string;
    environment?: APIKeyEnvironment;
    scope?: APIKeyScope | APIKeyScope[];
    rateLimit?: number;
    allowedIPs?: string[];
    allowedDomains?: string[];
    description?: string;
    expiresInDays?: number;
    isActive?: boolean;
    revoked?: boolean;
    revokedReason?: string;
    usageCount?: number;
    lastUsedIP?: string | null;
    lastUsedAt?: Date | null;
    expiresAt?: Date;
}

export class APIKeyGenerator {
    private static nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);
    private static counter = 0;

    public static generate(options: APIKeyGeneratorOptions = {}): Omit<APIKey, 'id' | 'createdAt'> {
        const now = new Date();
        const keyId = this.nanoid(8);
        const key = this.generateKeyString();

        // Generate a unique expiration date by adding counter minutes to ensure uniqueness
        const expiresAt = options.expiresAt || new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000) + (this.counter++ * 60 * 1000));

        return {
            userId: options.userId ?? 1,
            key,
            keyId,
            name: options.name ?? `API Key ${keyId}`,
            environment: `${options.environment || 'development'}-${this.counter}` as APIKeyEnvironment,
            scope: this.normalizeScope(options.scope ?? 'read'),
            rateLimit: options.rateLimit ?? 100,
            allowedIPs: options.allowedIPs ?? [],
            allowedDomains: options.allowedDomains ?? [],
            description: options.description ?? `Generated API key for testing`,
            updatedAt: now,
            expiresAt,
            lastUsedAt: options.lastUsedAt ?? null,
            lastUsedIP: options.lastUsedIP ?? null,
            usageCount: options.usageCount ?? 0,
            isActive: options.isActive ?? true,
            revoked: options.revoked ?? false,
            revokedAt: options.revoked ? now : null,
            revokedReason: options.revoked ? (options.revokedReason ?? 'Revoked for testing') : null,
        };
    }

    public static generateExpired(options: APIKeyGeneratorOptions = {}): Omit<APIKey, 'id' | 'createdAt'> {
        const now = new Date();
        // Generate a unique past date for expiration
        const pastDate = new Date(now.getTime() - (24 * 60 * 60 * 1000) - (this.counter++ * 60 * 1000));
        return this.generate({
            ...options,
            expiresAt: pastDate,
        });
    }

    public static generateRevoked(options: APIKeyGeneratorOptions = {}): Omit<APIKey, 'id' | 'createdAt'> {
        return this.generate({
            ...options,
            revoked: true,
            isActive: false,
            revokedReason: options.revokedReason ?? 'Revoked for security',
        });
    }

    public static generateHighUsage(options: APIKeyGeneratorOptions = {}): Omit<APIKey, 'id' | 'createdAt'> {
        return this.generate({
            ...options,
            usageCount: options.usageCount ?? 10000,
            lastUsedAt: new Date(),
            lastUsedIP: options.lastUsedIP ?? '192.168.1.1',
        });
    }

    private static generateKeyString(): string {
        const prefix = 'pk';
        const timestamp = Date.now().toString(36);
        const random = this.nanoid(24);
        return `${prefix}_${timestamp}_${random}`;
    }

    private static normalizeScope(scope: APIKeyScope | APIKeyScope[]): APIKeyScope[] {
        return Array.isArray(scope) ? scope : [scope];
    }

    /**
     * Resets the counter used for generating unique values.
     * Useful when running multiple test suites.
     */
    public static resetCounter(): void {
        this.counter = 0;
    }
}