const constants = {
  /** Paths that are publicly accessible without authentication */
  PUBLIC_PATHS: ["/", "/openapi", "/health", "/openapi.json", "/doc"],

  /** Cache TTL in seconds */
  CACHE_TTL: 3600,
};

export default constants;
