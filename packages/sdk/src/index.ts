import type { Database } from "@midday/supabase/types";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import {
  Inbox,
  Invoices,
  Metrics,
  Settings,
  Tracker,
  Transactions,
  Vault,
} from "./resource";
import type { SDKOptions } from "./types";

const API_ENDPOINT = "https://api.midday.ai/v1";

export class Midday {
  #options: SDKOptions;
  #client: SupabaseClient<Database>;

  public transactions: Transactions;
  public invoices: Invoices;
  public tracker: Tracker;
  public inbox: Inbox;
  public vault: Vault;
  public metrics: Metrics;
  public settings: Settings;

  constructor(options: SDKOptions) {
    this.#options = {
      ...options,
      apiKey: options.apiKey || process.env.MIDDAY_API_KEY || "",
    };

    if (!this.#options.apiKey) {
      throw new Error(
        "You need to provide an API key, either via the constructor or the MIDDAY_API_KEY environment variable: https://docs.midday.ai/sdk",
      );
    }

    this.#client = createClient(API_ENDPOINT, undefined, {
      global: {
        headers: {
          Authorization: `Bearer ${this.#options.apiKey}`,
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
    });

    this.transactions = new Transactions(this.#client);
    this.invoices = new Invoices(this.#client);
    this.tracker = new Tracker(this.#client);
    this.inbox = new Inbox(this.#client);
    this.vault = new Vault(this.#client);
    this.metrics = new Metrics(this.#client);
    this.settings = new Settings(this.#client);
  }
}
