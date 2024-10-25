import { randomBytes } from "crypto";

class TestDataGenerator {
    private seed: string;
    private counter: number;

    constructor(seed?: string) {
        this.seed = seed || randomBytes(16).toString('hex');
        this.counter = 0;
    }

    /**
     * Gets the current seed value
     */
    getSeed(): string {
        return this.seed;
    }

    /**
     * Generates a deterministic random number based on seed and counter
     */
    private generateSeededRandom(): number {
        const hash = Array.from(this.seed + this.counter.toString())
            .reduce((hash, char) => {
                return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
            }, 0);

        this.counter++;
        return (Math.abs(hash) % 100000) / 100000;
    }

    /**
     * Generates a random string of specified length
     */
    private generateRandomString(length: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(this.generateSeededRandom() * chars.length);
            result += chars[randomIndex];
        }

        return result;
    }

    /**
     * Generates a random email address
     */
    generateEmail(options: {
        prefix?: string;
        domain?: string;
        length?: number;
    } = {}): string {
        const {
            prefix = 'test',
            domain = 'example.com',
            length = 8
        } = options;

        const randomPart = this.generateRandomString(length);
        return `${prefix}-${randomPart}@${domain}`;
    }

    /**
     * Generates a random username
     */
    generateUsername(options: {
        prefix?: string;
        length?: number;
    } = {}): string {
        const {
            prefix = 'user',
            length = 8
        } = options;

        const randomPart = this.generateRandomString(length);
        return `${prefix}-${randomPart}`;
    }

    /**
     * Generates a random name
     */
    generateName(options: {
        firstName?: boolean;
        lastName?: boolean;
    } = {}): string {
        const {
            firstName = true,
            lastName = true
        } = options;

        const firstNames = [
            'John', 'Jane', 'Alice', 'Bob', 'Charlie',
            'David', 'Eva', 'Frank', 'Grace', 'Henry'
        ];
        const lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
            'Garcia', 'Miller', 'Davis', 'Wilson', 'Anderson'
        ];

        const randomFirst = firstNames[Math.floor(this.generateSeededRandom() * firstNames.length)];
        const randomLast = lastNames[Math.floor(this.generateSeededRandom() * lastNames.length)];

        if (firstName && lastName) return `${randomFirst} ${randomLast}`;
        if (firstName) return randomFirst;
        if (lastName) return randomLast;
        return randomFirst;
    }

    /**
     * Generates test user data
     */
    generateUserData(overrides: Partial<{
        email: string;
        name: string;
        role: string;
        status: string;
    }> = {}) {
        return {
            email: overrides.email ?? this.generateEmail(),
            name: overrides.name ?? this.generateName(),
            role: overrides.role ?? 'user',
            status: overrides.status ?? 'active'
        };
    }

    /**
     * Resets the generator with a new seed
     */
    reset(newSeed?: string): void {
        this.seed = newSeed || randomBytes(16).toString('hex');
        this.counter = 0;
    }
}

// Create a singleton instance for global use
const generator = new TestDataGenerator();

export {
    TestDataGenerator,
    generator as testDataGenerator
};

// Example usage:
// const generator = new TestDataGenerator('fixed-seed-123');
// const email1 = generator.generateEmail(); // Will always generate the same email for the same seed
// const name1 = generator.generateName(); // Will always generate the same name for the same seed
// 
// // Generate with options
// const email2 = generator.generateEmail({ prefix: 'admin', domain: 'company.com', length: 12 });
// const username = generator.generateUsername({ prefix: 'test', length: 10 });
// 
// // Generate complete user da