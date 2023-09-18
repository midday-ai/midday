import { createContext, useContext, useEffect, useState } from "react";
import {
  SplashScreen,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import type { TokensPayload } from "@/utils/auth";
import { deleteToken, getAccessToken, setTokens } from "@/utils/auth";

interface AuthContext {
  signedIn: boolean;
  signOut: () => void;
  signIn: (tokens: TokensPayload) => void;
}

const AuthContext = createContext<AuthContext>({
  signedIn: false,
  signOut: () => {},
  signIn: () => {},
});

export const useAuth = () => useContext(AuthContext);

function useProtectedRoute(signedIn: boolean) {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const router = useRouter();

  useEffect(() => {
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === "(auth)";

    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 600);

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !signedIn &&
      !inAuthGroup
    ) {
      // Redirect to the sign-in page.
      router.replace("/login");
    } else if (signedIn && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace("/home");
    }
  }, [signedIn, segments, navigationState]);
}

export function AuthProvider({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const [signedIn, setSignedIn] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
      const token = await getAccessToken();

      if (token) {
        setSignedIn(true);
      }
    }

    init();
  }, []);

  useProtectedRoute(signedIn);

  const signOut = async () => {
    deleteToken();
    setSignedIn(false);
  };

  const signIn = async (token: TokensPayload) => {
    setSignedIn(true);
    setTokens(token);
  };

  const authContext: AuthContext = {
    signedIn,
    signOut,
    signIn,
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}
