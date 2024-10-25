using Workerd = import "/workerd/workerd.capnp";



const mainWorker :Workerd.Worker = (
  globalOutbound = "fullNetwork",
  modules = [
    (name = "worker", esModule = embed "./dist/worker.js")
  ]
  
bindings = [
    ( name = "KEY_MIGRATIONS", queue = "main"),
    ( name = "VERSION", fromEnvironment = "VERSION"),
    ( name = "DB", d1Database = "DB"),
    ( name = "KV", kvNamespace = "KV"),
    ( name = "STORAGE", r2Bucket = "STORAGE"),
    ( name = "BANK_STATEMENTS", r2Bucket = "BANK_STATEMENTS"),
    ( name = "TELLER_CERT", serviceWorker = "TELLER_CERT"),
    ( name = "USER_ACTIONS_QUEUE", queue = "USER_ACTIONS_QUEUE"),
    ( name = "API_SECRET_KEY", fromEnvironment = "API_SECRET_KEY"),
    ( name = "GOCARDLESS_SECRET_ID", fromEnvironment = "GOCARDLESS_SECRET_ID"),
    ( name = "GOCARDLESS_SECRET_KEY", fromEnvironment = "GOCARDLESS_SECRET_KEY"),
    ( name = "PLAID_CLIENT_ID", fromEnvironment = "PLAID_CLIENT_ID"),
    ( name = "PLAID_ENVIRONMENT", fromEnvironment = "PLAID_ENVIRONMENT"),
    ( name = "PLAID_SECRET", fromEnvironment = "PLAID_SECRET"),
    ( name = "TYPESENSE_API_KEY", fromEnvironment = "TYPESENSE_API_KEY"),
    ( name = "TYPESENSE_ENDPOINT_AU", fromEnvironment = "TYPESENSE_ENDPOINT_AU"),
    ( name = "TYPESENSE_ENDPOINT_EU", fromEnvironment = "TYPESENSE_ENDPOINT_EU"),
    ( name = "TYPESENSE_ENDPOINT_US", fromEnvironment = "TYPESENSE_ENDPOINT_US"),
    ( name = "TYPESENSE_ENDPOINT", fromEnvironment = "TYPESENSE_ENDPOINT"),
    ( name = "UPSTASH_REDIS_REST_TOKEN", fromEnvironment = "UPSTASH_REDIS_REST_TOKEN"),
    ( name = "UPSTASH_REDIS_REST_URL", fromEnvironment = "UPSTASH_REDIS_REST_URL"),
    ( name = "STRIPE_SECRET_KEY", fromEnvironment = "STRIPE_SECRET_KEY"),
    ( name = "UNKEY_API_KEY", fromEnvironment = "UNKEY_API_KEY"),
    ( name = "CLOUDFLARE_API_KEY", fromEnvironment = "CLOUDFLARE_API_KEY"),
    ( name = "CLOUDFLARE_ZONE_ID", fromEnvironment = "CLOUDFLARE_ZONE_ID"),
    ( name = "ENVIRONMENT", fromEnvironment = "ENVIRONMENT"),
    ( name = "PLATFORM_PREFIX", fromEnvironment = "PLATFORM_PREFIX"),
  ],

  compatibilityDate = "2024-02-19",
  compatibilityFlags = ["nodejs_compat"]
  # Learn more about compatibility dates at:
  # https://developers.cloudflare.com/workers/platform/compatibility-dates/

  
);

const config :Workerd.Config = (
  services = [
    (
      name = "main", 
      worker = .mainWorker,
    ),
    (
      name = "fullNetwork",
      network = (
  allow = ["public", "private", "local", "network", "unix", "unix-abstract"],
  tlsOptions = (trustBrowserCas = true)
)
    )
  ],

  sockets = [
    # Serve HTTP on port 8787.
    ( name = "http",
      address = "*:8787",
      http = (),
      service = "main"
    ),
  ]
);