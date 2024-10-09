import baseX from "base-x";

const b58 = baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

const prefixes = {
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

/**
 * Generates a new unique identifier with a specific prefix.
 * 
 * This function creates a unique ID by combining:
 * 1. A prefix based on the type of entity (e.g., "key_" for keys, "pol_" for policies).
 * 2. A base58-encoded string derived from:
 *    a. A 32-bit timestamp (seconds since a custom epoch).
 *    b. 16 bytes of cryptographically secure random data.
 * 
 * The ID format is designed to be:
 * - Chronologically sortable (first 32 bits represent time).
 * - Highly collision-resistant due to the additional random data.
 * - URL-safe and readable, using base58 encoding.
 * 
 * The custom epoch (Nov 14, 2023) allows for a longer useful lifetime of IDs
 * before the 32-bit timestamp overflows, extending until the year 2159.
 * 
 * @param prefix - The type of entity for which the ID is being generated.
 *                 This must be a key of the `prefixes` object.
 * 
 * @returns A string in the format `${prefix}_${base58EncodedData}`.
 *          The return type is `const` to preserve the literal type of the prefix.
 * 
 * @example
 * const newKeyId = newId('key'); // Might return "key_3yiCfJGYJVdXxnHk7fofQe"
 */
export function newId<TPrefix extends keyof typeof prefixes>(prefix: TPrefix) {
    const buf = crypto.getRandomValues(new Uint8Array(20));

    /**
     * Custom epoch starts at 2023-11-14T22:13:20.000Z.
     * This allows the 32-bit timestamp to remain useful until 2159-12-22T04:41:36.000Z,
     * providing a significantly longer lifetime compared to using the standard Unix epoch.
     */
    const EPOCH_TIMESTAMP = 1_700_000_000_000;

    const t = Date.now() - EPOCH_TIMESTAMP;

    // Insert the 32-bit timestamp into the first 4 bytes of the buffer
    buf[0] = (t >>> 24) & 255;
    buf[1] = (t >>> 16) & 255;
    buf[2] = (t >>> 8) & 255;
    buf[3] = t & 255;

    return `${prefixes[prefix]}_${b58.encode(buf)}` as const;
}