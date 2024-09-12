import { useEffect, useState } from "react";
import { useAuth0, User } from "@auth0/auth0-react";

export function useAuthToken() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
      }
    };

    fetchToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  return token;
}

interface AuthUser extends User {
  accessToken?: string;
}

interface UseAuthUserResult {
  authUser: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}

/**
 * A custom hook that manages the authentication state and retrieves user
 * details including an access token. It utilizes the Auth0 authentication
 * service.
 *
 * @returns An object containing the authenticated user's details, loading
 *   status, any errors encountered, and authentication status.
 */
export function useAuthUser(): UseAuthUserResult {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } =
    useAuth0<User>();

  // State to hold the authenticated user's details including the access token.
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // State to hold any errors that may occur during the authentication process.
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetches user details if authenticated and user information is available.
    const fetchUserDetails = async () => {
      if (isAuthenticated && user) {
        try {
          // Attempt to get the access token silently.
          const accessToken = await getAccessTokenSilently();

          // Update the state with the user's details and access token.
          setAuthUser({ ...user, accessToken });
        } catch (err) {
          // If an error occurs, update the error state.
          if (err instanceof Error) {
            setError(err);
          }
        }
      }
    };

    fetchUserDetails();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  // Return the authentication state including user details, loading status, error, and authentication status.
  return { authUser, isLoading, error, isAuthenticated };
}
