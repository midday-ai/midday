import baseX from "base-x";

const b58 = baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

export const prefixes = {
    key: "key",
    policy: "pol",
    api: "api",
    request: "req",
    workspace: "ws",
    keyAuth: "ks", // keyspace
    vercelBinding: "vb",
    role: "role",
    test: "test", // for tests only
    auditLog: "log",
    ratelimitNamespace: "rlns",
    ratelimitOverride: "rlor",
    permission: "perm",
    secret: "sec",
    headerRewrite: "hrw",
    gateway: "gw",
    llmGateway: "lgw",
    webhook: "wh",
    event: "evt",
    reporter: "rep",
    webhookDelivery: "whd",
    identity: "id",
    ratelimit: "rl",
} as const;

// Keep track of sequence numbers for each millisecond
const sequenceTracker = new Map<number, number>();

// Counter for sub-millisecond resolution
let lastTimestamp = 0;
let counter = 0n;

/**
 * Generates a new unique identifier with enhanced collision resistance.
 * 
 * The ID format is now:
 * - 4 bytes (32 bits) for timestamp since custom epoch
 * - 2 bytes (16 bits) for sequence number within the same millisecond
 * - 2 bytes (16 bits) for process-specific counter
 * - 16 bytes for random data
 * 
 * This gives us:
 * - Chronological sorting
 * - 65,536 unique IDs per millisecond per process
 * - Additional entropy from random data
 * - Total length of 24 bytes (192 bits)
 */
export function newId<TPrefix extends keyof typeof prefixes>(prefix: TPrefix) {
    const buf = new Uint8Array(24); // Increased to 24 bytes
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));

    // Get current timestamp
    const EPOCH_TIMESTAMP = 1_700_000_000_000;
    const timestamp = Date.now() - EPOCH_TIMESTAMP;

    // Handle sub-millisecond sequence
    if (timestamp === lastTimestamp) {
        counter++;
    } else {
        counter = 0n;
        lastTimestamp = timestamp;
    }

    // Get or initialize sequence number for this millisecond
    let sequence = sequenceTracker.get(timestamp) || 0;
    sequenceTracker.set(timestamp, sequence + 1);

    // Clean up old timestamp entries (keep last 1000 milliseconds)
    const oldestToKeep = timestamp - 1000;
    for (const [key] of sequenceTracker) {
        if (key < oldestToKeep) {
            sequenceTracker.delete(key);
        }
    }

    // Insert 32-bit timestamp
    buf[0] = (timestamp >>> 24) & 255;
    buf[1] = (timestamp >>> 16) & 255;
    buf[2] = (timestamp >>> 8) & 255;
    buf[3] = timestamp & 255;

    // Insert 16-bit sequence number
    buf[4] = (sequence >>> 8) & 255;
    buf[5] = sequence & 255;
    // Insert 16-bit process counter
    buf[6] = Number(counter >> 8n) & 255;
    buf[7] = Number(counter) & 255;

    // Insert random bytes
    buf.set(randomBytes, 8);

    // Add process-specific entropy
    const processEntropy = BigInt(process.pid || Date.now()) & 0xFFFFn;
    buf[22] = Number(processEntropy >> 8n) & 255;
    buf[23] = Number(processEntropy) & 255;

    // Format components for debugging
    const components = {
        timestamp: timestamp.toString(16).padStart(8, '0'),
        sequence: sequence.toString(16).padStart(4, '0'),
        counter: counter.toString(16).padStart(4, '0'),
        random: Buffer.from(randomBytes).toString('hex'),
        process: processEntropy.toString(16).padStart(4, '0')
    };

    // Log components in development
    if (process.env.NODE_ENV === 'development') {
        console.debug('ID Components:', components);
    }

    return `${prefixes[prefix]}_${b58.encode(buf)}` as const;
}

/**
 * Validates the uniqueness of a batch of IDs.
 * Useful for testing and verification.
 */
export function validateIds(ids: string[]): {
    isUnique: boolean;
    duplicates: string[];
    details: { total: number; unique: number }
} {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const id of ids) {
        if (seen.has(id)) {
            duplicates.add(id);
        }
        seen.add(id);
    }

    return {
        isUnique: duplicates.size === 0,
        duplicates: Array.from(duplicates),
        details: {
            total: ids.length,
            unique: seen.size
        }
    };
}

/**
 * Extracts timestamp from an ID for debugging and verification.
 */
export function extractTimestamp(id: string): {
    timestamp: Date;
    sequence: number;
    counter: number;
} {
    const [, encoded] = id.split('_');
    const buf = b58.decode(encoded);

    const timestamp = (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3];
    const sequence = (buf[4] << 8) | buf[5];
    const counter = (buf[6] << 8) | buf[7];

    return {
        timestamp: new Date(timestamp + 1_700_000_000_000),
        sequence,
        counter
    };
}