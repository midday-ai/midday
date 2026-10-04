import { getEnabledSocialProviders } from "@midday/auth/providers";
import { Icons } from "@midday/ui/icons";
import { cookies } from "next/headers";
import Link from "next/link";
import { LoginVideoBackground } from "@/components/login-video-background";
import { OAuthSignIn } from "@/components/oauth-sign-in";
import { OTPSignIn } from "@/components/otp-sign-in";
import { SunsetBanner } from "@/components/sunset-banner";
import { getSession } from "@/lib/auth";
import { Cookies } from "@/utils/constants";
import { isBlockedNewUser } from "@/utils/new-user-gate";

type Props = {
  searchParams: Promise<{ waitlist?: string }>;
};

export default async function LocalLoginPage({ searchParams }: Props) {
  const { waitlist: waitlistParam } = await searchParams;
  const cookieStore = await cookies();
  const preferred = cookieStore.get(Cookies.PreferredSignInProvider);
  const session = await getSession();
  const showQueueNotice =
    waitlistParam === "1" || isBlockedNewUser(session?.user.createdAt);
  const providers = getEnabledSocialProviders();
  const preferredSignInOption = (
    <div className="flex flex-col space-y-3 w-full">
      {providers.map((provider) => (
        <OAuthSignIn
          key={provider}
          provider={provider}
          showLastUsed={preferred?.value === provider}
        />
      ))}
      <OTPSignIn />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Sunset banner + logo - Fixed position matching website header exactly */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <SunsetBanner />
        <nav className="w-full pointer-events-none">
          <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center">
            <Link
              href="https://midday.ai"
              className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 pointer-events-auto"
            >
              <div className="w-6 h-6">
                <Icons.LogoSmall className="w-full h-full text-foreground lg:text-white" />
              </div>
            </Link>
          </div>
        </nav>
      </div>

      {/* Left Side - Video Background */}
      <LoginVideoBackground />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {showQueueNotice ? (
              <div className="text-center space-y-2">
                <h1 className="text-lg lg:text-xl mb-4 font-serif">
                  You're on the waitlist
                </h1>
                <p className="font-sans text-sm text-[#878787]">
                  Midday is not accepting new sign-ups right now. You've been
                  added to our queue and we'll email you as soon as a spot opens
                  up.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="text-center space-y-2">
                  <h1 className="text-lg lg:text-xl mb-4 font-serif">
                    Welcome to Midday
                  </h1>
                  <p className="font-sans text-sm text-[#878787]">
                    Sign in or create an account
                  </p>
                </div>

                {/* Sign In Options */}
                <div className="space-y-3 flex items-center justify-center w-full">
                  {preferredSignInOption}
                </div>
              </>
            )}
          </div>

          {/* Terms and Privacy Policy - Bottom aligned */}
          <div className="text-center mt-auto">
            <p className="font-sans text-xs text-[#878787]">
              By signing in you agree to our{" "}
              <Link
                href="https://midday.ai/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Terms of service
              </Link>{" "}
              &{" "}
              <Link
                href="https://midday.ai/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                Privacy policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
