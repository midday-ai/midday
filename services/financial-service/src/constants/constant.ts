const constants = {
  /** Paths that are publicly accessible without authentication */
  PUBLIC_PATHS: [
    "/",
    "/openapi",
    "/health",
    "/openapi.json",
    "/v1/api.users", // the users routes should be public as this should be where users can create accounts, ... etcs
    "/v1/api.apikeys", // the api keys routes should be public as this should be where users can create api keys
  ],

  /** Cache TTL in seconds */
  CACHE_TTL: 3600,
};

export default constants;
