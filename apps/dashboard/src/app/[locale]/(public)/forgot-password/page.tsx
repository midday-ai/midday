import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forgot Password | abacus",
};

export default function Page() {
  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 active:opacity-80 transition-opacity duration-200 pointer-events-auto"
          >
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground" />
            </div>
          </Link>
        </div>
      </nav>

      {/* Centered Form */}
      <div className="w-full flex flex-col justify-center items-center p-8 lg:p-12">
        <div className="w-full max-w-md flex flex-col">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-lg mb-4 font-serif">Reset your password</h1>
              <p className="font-sans text-sm text-[#878787]">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {/* Form */}
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
