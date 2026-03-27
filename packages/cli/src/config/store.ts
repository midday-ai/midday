import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

interface Credentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  teamName?: string;
  teamId?: string;
  userId?: string;
}

interface Config {
  apiUrl?: string;
  defaultFormat?: "json" | "table";
}

function getConfigDir(): string {
  const xdg = process.env["XDG_CONFIG_HOME"];
  const base = xdg || path.join(os.homedir(), ".config");
  return path.join(base, "midday");
}

function ensureConfigDir(): string {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

function credentialsPath(): string {
  return path.join(getConfigDir(), "credentials.json");
}

function configPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function getCredentials(): Credentials | null {
  try {
    const raw = fs.readFileSync(credentialsPath(), "utf-8");
    return JSON.parse(raw) as Credentials;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: Credentials): void {
  const dir = ensureConfigDir();
  const filePath = path.join(dir, "credentials.json");
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2), { mode: 0o600 });
}

export function clearCredentials(): void {
  try {
    fs.unlinkSync(credentialsPath());
  } catch {
    // Already gone
  }
}

export function getConfig(): Config {
  try {
    const raw = fs.readFileSync(configPath(), "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

export function saveConfig(config: Config): void {
  const dir = ensureConfigDir();
  const filePath = path.join(dir, "config.json");
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function getToken(): string | null {
  const envKey = process.env["MIDDAY_API_KEY"];
  if (envKey) return envKey;

  const creds = getCredentials();
  if (!creds) return null;

  if (creds.expiresAt && Date.now() > creds.expiresAt) {
    return null;
  }

  return creds.accessToken;
}
