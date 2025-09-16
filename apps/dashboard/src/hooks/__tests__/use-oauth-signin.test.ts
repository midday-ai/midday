import { describe, expect, test, mock, beforeEach } from "bun:test";
import { renderHook } from "@testing-library/react-hooks/server";
import { act } from "react";
import { useOAuthSignIn } from "../use-oauth-signin";

// Mock dependencies
const mockToast = mock(() => {});
const mockSignInWithOAuth = mock(() => Promise.resolve({ error: null }));
const mockCreateClient = mock(() => ({
  auth: {
    signInWithOAuth: mockSignInWithOAuth,
  },
}));
const mockGetUrl = mock(() => "http://localhost:3001");
const mockIsDesktopApp = mock(() => false);
const mockSearchParamsGet = mock((param: string): string | null => null);
const mockUseSearchParams = mock(() => ({
  get: mockSearchParamsGet,
}));

// Mock modules
mock.module("@midday/supabase/client", () => ({
  createClient: mockCreateClient,
}));

mock.module("@midday/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

mock.module("@/utils/environment", () => ({
  getUrl: mockGetUrl,
}));

mock.module("@midday/desktop-client/platform", () => ({
  isDesktopApp: mockIsDesktopApp,
}));

mock.module("next/navigation", () => ({
  useSearchParams: mockUseSearchParams,
}));

// No need to mock React hooks when using @testing-library/react-hooks

describe("useOAuthSignIn", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockToast.mockClear();
    mockSignInWithOAuth.mockClear();
    mockCreateClient.mockClear();
    mockGetUrl.mockClear();
    mockIsDesktopApp.mockClear();
    mockUseSearchParams.mockClear();
    mockSearchParamsGet.mockClear();
    
    // Set default mock return values
    mockGetUrl.mockReturnValue("http://localhost:3001");
    mockIsDesktopApp.mockReturnValue(false);
    mockSearchParamsGet.mockImplementation((param: string): string | null => null);
    mockSignInWithOAuth.mockResolvedValue({ error: null });
  });

  describe("initialization", () => {
    test("should return correct interface", () => {
      const { result } = renderHook(() => useOAuthSignIn({ provider: "google" }));

      expect(typeof result.current.isLoading).toBe("boolean");
      expect(typeof result.current.signIn).toBe("function");
      expect(result.current.isLoading).toBe(false);
    });

    test("should accept different OAuth providers", () => {
      const providers = ["apple", "github", "google"] as const;
      
      providers.forEach((provider) => {
        const { result } = renderHook(() => useOAuthSignIn({ provider }));
        expect(typeof result.current.signIn).toBe("function");
      });
    });
  });

  describe("signIn function", () => {
    test("should call signInWithOAuth with correct parameters for web app", async () => {
      const { result } = renderHook(() => useOAuthSignIn({ provider: "github" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=github",
          queryParams: {},
        },
      });
    });

    test("should include desktop client parameter when in desktop app", async () => {
      mockIsDesktopApp.mockReturnValue(true);

      const { result } = renderHook(() => useOAuthSignIn({ provider: "apple" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "apple",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=apple&client=desktop",
          queryParams: {
            client: "desktop",
          },
        },
      });
    });

    test("should include return_to parameter when useReturnTo is true and returnTo exists", async () => {
      mockSearchParamsGet.mockImplementation((param: string) => 
        param === "return_to" ? "/dashboard" : null
      );

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "google", 
        useReturnTo: true 
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=google&return_to=%2Fdashboard",
          queryParams: {},
        },
      });
    });

    test("should not include return_to parameter when useReturnTo is false", async () => {
      mockSearchParamsGet.mockImplementation((param: string) => 
        param === "return_to" ? "/dashboard" : null
      );

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "google", 
        useReturnTo: false 
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=google",
          queryParams: {},
        },
      });
    });

    test("should include extra query parameters", async () => {
      const extraQueryParams = { 
        scope: "read:user", 
        state: "abc123" 
      };

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "github", 
        extraQueryParams 
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=github",
          queryParams: extraQueryParams,
        },
      });
    });

    test("should combine desktop and extra query parameters", async () => {
      mockIsDesktopApp.mockReturnValue(true);
      const extraQueryParams = { scope: "read:user" };

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "github", 
        extraQueryParams 
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=github&client=desktop",
          queryParams: {
            scope: "read:user",
            client: "desktop",
          },
        },
      });
    });
  });

  describe("error handling", () => {
    test("should show toast and log error when OAuth sign-in fails", async () => {
      const error = { message: "OAuth provider error" };
      mockSignInWithOAuth.mockResolvedValue({ error } as any);
      
      // Mock console.error to verify logging
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      const { result } = renderHook(() => useOAuthSignIn({ provider: "google" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Sign-in Error",
        description: "OAuth provider error",
        variant: "destructive",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "google OAuth sign-in failed",
        error,
        {
          action: "oauth_signin_failed",
          provider: "google",
          errorMessage: "OAuth provider error",
          isDesktop: false,
        }
      );

      console.error = originalConsoleError;
    });

    test("should handle exceptions during sign-in", async () => {
      const error = new Error("Network error");
      mockSignInWithOAuth.mockRejectedValue(error);
      
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      const { result } = renderHook(() => useOAuthSignIn({ provider: "apple" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Sign-in Error",
        description: "Network error",
        variant: "destructive",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "apple OAuth sign-in exception",
        error,
        {
          action: "oauth_signin_exception",
          provider: "apple",
          errorMessage: "Network error",
          isDesktop: false,
        }
      );

      console.error = originalConsoleError;
    });

    test("should handle non-Error exceptions", async () => {
      const error = "String error";
      mockSignInWithOAuth.mockRejectedValue(error);
      
      const originalConsoleError = console.error;
      const consoleSpy = mock(() => {});
      console.error = consoleSpy;

      const { result } = renderHook(() => useOAuthSignIn({ provider: "github" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Sign-in Error",
        description: "Unknown error",
        variant: "destructive",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "github OAuth sign-in exception",
        error,
        {
          action: "oauth_signin_exception",
          provider: "github",
          errorMessage: "Unknown error",
          isDesktop: false,
        }
      );

      console.error = originalConsoleError;
    });
  });

  describe("integration scenarios", () => {
    test("should handle complete desktop OAuth flow with return_to", async () => {
      mockIsDesktopApp.mockReturnValue(true);
      mockSearchParamsGet.mockImplementation((param: string) => 
        param === "return_to" ? "/settings" : null
      );

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "apple", 
        useReturnTo: true,
        extraQueryParams: { scope: "email" }
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "apple",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=apple&return_to=%2Fsettings&client=desktop",
          queryParams: {
            scope: "email",
            client: "desktop",
          },
        },
      });
    });

    test("should handle performance measurement", async () => {
      const originalPerformanceNow = performance.now;
      const performanceSpy = mock(() => 1000);
      performance.now = performanceSpy;

      const { result } = renderHook(() => useOAuthSignIn({ provider: "google" }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(performanceSpy).toHaveBeenCalled();
      
      performance.now = originalPerformanceNow;
    });

    test("should build correct URL encoding for return_to parameter", async () => {
      mockSearchParamsGet.mockImplementation((param: string) => 
        param === "return_to" ? "/dashboard?tab=settings&view=profile" : null
      );

      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "google", 
        useReturnTo: true 
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      const expectedRedirectTo = "http://localhost:3001/api/auth/callback?provider=google&return_to=%2Fdashboard%3Ftab%3Dsettings%26view%3Dprofile";

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: expectedRedirectTo,
          queryParams: {},
        },
      });
    });

    test("should handle empty extra query parameters", async () => {
      const { result } = renderHook(() => useOAuthSignIn({ 
        provider: "github", 
        extraQueryParams: {}
      }));
      
      await act(async () => {
        await result.current.signIn();
      });

      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: {
          redirectTo: "http://localhost:3001/api/auth/callback?provider=github",
          queryParams: {},
        },
      });
    });

    test("should work with all supported OAuth providers", async () => {
      const providers = ["apple", "github", "google"] as const;
      
      for (const provider of providers) {
        mockSignInWithOAuth.mockClear();
        
        const { result } = renderHook(() => useOAuthSignIn({ provider }));
        await act(async () => {
          await result.current.signIn();
        });

        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider,
          options: {
            redirectTo: `http://localhost:3001/api/auth/callback?provider=${provider}`,
            queryParams: {},
          },
        });
      }
    });
  });
});