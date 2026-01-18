"use client";

import { AppleSignIn } from "@/components/apple-sign-in";
import { GithubSignIn } from "@/components/github-sign-in";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginAccordion } from "@/components/login-accordion";
import { LoginVideoBackground } from "@/components/login-video-background";
import { OTPSignIn } from "@/components/otp-sign-in";
import { useI18n } from "@/locales/client";
import Link from "next/link";

type Props = {
  preferredProvider?: string;
  isAppleDevice?: boolean;
};

export function LoginContent({ preferredProvider, isAppleDevice }: Props) {
  const t = useI18n();

  let moreSignInOptions = null;
  let preferredSignInOption =
    isAppleDevice ? (
      <div className="flex flex-col space-y-3 w-full">
        <GoogleSignIn showLastUsed={preferredProvider === "google"} />
        <AppleSignIn showLastUsed={preferredProvider === "apple"} />
      </div>
    ) : (
      <GoogleSignIn
        showLastUsed={!preferredProvider || preferredProvider === "google"}
      />
    );

  switch (preferredProvider) {
    case "apple":
      preferredSignInOption = <AppleSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <GithubSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "github":
      preferredSignInOption = <GithubSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "google":
      preferredSignInOption = <GoogleSignIn showLastUsed={true} />;
      moreSignInOptions = (
        <>
          <AppleSignIn />
          <GithubSignIn />
          <OTPSignIn className="border-t-[1px] border-border pt-8" />
        </>
      );
      break;

    case "otp":
      preferredSignInOption = <OTPSignIn />;
      moreSignInOptions = (
        <>
          <GoogleSignIn />
          <AppleSignIn />
          <GithubSignIn />
        </>
      );
      break;

    default:
      if (isAppleDevice) {
        moreSignInOptions = (
          <>
            <GithubSignIn />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      } else {
        moreSignInOptions = (
          <>
            <AppleSignIn />
            <GithubSignIn />
            <OTPSignIn className="border-t-[1px] border-border pt-8" />
          </>
        );
      }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Video Background */}
      <LoginVideoBackground />

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 pb-2">
        <div className="w-full max-w-md flex flex-col h-full">
          <div className="space-y-8 flex-1 flex flex-col justify-center">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-lg mb-4 font-serif">{t("auth.welcome")}</h1>
              <p className="font-sans text-sm text-[#878787]">
                {t("auth.sign_in_or_create")}
              </p>
            </div>

            {/* Sign In Options */}
            <div className="space-y-3 flex items-center justify-center w-full">
              {preferredSignInOption}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background font-sans text-[#878787]">
                  {t("auth.or")}
                </span>
              </div>
            </div>

            {/* More Options Accordion */}
            <LoginAccordion>{moreSignInOptions}</LoginAccordion>
          </div>

          {/* Terms and Privacy Policy - Bottom aligned */}
          <div className="text-center mt-auto">
            <p className="font-sans text-xs text-[#878787]">
              {t("auth.terms_prefix")}{" "}
              <Link
                href="https://midday.ai/terms"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                {t("auth.terms_of_service")}
              </Link>{" "}
              {t("auth.and")}{" "}
              <Link
                href="https://midday.ai/policy"
                className="text-[#878787] hover:text-foreground transition-colors underline"
              >
                {t("auth.privacy_policy")}
              </Link>
              {t("auth.terms_suffix")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
