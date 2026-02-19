"use client";

import { LogEvents } from "@midday/events/events";
import { BulkReconciliationAnimation } from "@midday/ui/animations/bulk-reconciliation";
import { ReceiptAttachmentAnimation } from "@midday/ui/animations/receipt-attachment";
import { WidgetsAnimation } from "@midday/ui/animations/widgets";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import type { ReactNode } from "react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";
import { useOnboardingTracking } from "@/hooks/use-onboarding-tracking";
import { useTRPC } from "@/trpc/client";
import {
  type BankSyncState,
  type InboxSyncState,
  OnboardingSyncStatus,
} from "./onboarding-sync-status";
import { OnboardingUserMenu } from "./onboarding-user-menu";
import { ConnectBankStep } from "./steps/connect-bank-step";
import { ConnectInboxStep } from "./steps/connect-inbox-step";
import { CreateTeamStep } from "./steps/create-team-step";
import { ReconciliationStep } from "./steps/reconciliation-step";
import { SetNameStep } from "./steps/set-name-step";
import { StartTrialStep } from "./steps/start-trial-step";

type StepConfig = {
  key: string;
  animation: ReactNode;
  content: ReactNode;
  overlay?: boolean;
  navigation: "none" | "submit" | "skip" | "next" | "finish";
  canGoBack?: boolean;
  trackEvent?: { name: string; channel: string };
};

function DashboardImageAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-center justify-center overflow-visible"
      style={{ width: "100%", height: "100%", transformOrigin: "center" }}
    >
      <Image
        src="https://cdn.midday.ai/web/dashboard-light.svg"
        alt="Dashboard illustration"
        width={2400}
        height={1800}
        className="h-auto transform -rotate-[2deg] dark:hidden"
        style={{ width: "140%", minWidth: "1400px" }}
        priority
      />
      <Image
        src="https://cdn.midday.ai/web/dashboard-dark.svg"
        alt="Dashboard illustration"
        width={2400}
        height={1800}
        className="h-auto transform -rotate-[2deg] hidden dark:block"
        style={{ width: "140%", minWidth: "1400px" }}
        priority
      />
    </motion.div>
  );
}

function GradientOverlay() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none z-[15] dark:hidden"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.2) 70%, rgba(255, 255, 255, 0.5) 85%, rgba(255, 255, 255, 0.8) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-[15] hidden dark:block"
        style={{
          background:
            "linear-gradient(to right, transparent 0%, transparent 50%, rgba(8, 8, 8, 0.2) 70%, rgba(8, 8, 8, 0.5) 85%, rgba(8, 8, 8, 0.8) 100%)",
        }}
      />
    </>
  );
}

type Props = {
  defaultCurrencyPromise: Promise<string>;
  defaultCountryCodePromise: Promise<string>;
  user: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    teamId: string | null;
  };
};

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  if (currentStep >= totalSteps) return null;

  return (
    <div className="flex justify-center">
      <motion.div
        layoutId="progress-bar-container"
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-32 h-1 bg-border overflow-hidden"
      >
        <motion.div
          layoutId="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{
            width: `${(currentStep / totalSteps) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full bg-primary"
        />
      </motion.div>
    </div>
  );
}

const NAV_LABELS: Record<StepConfig["navigation"], string | null> = {
  none: null,
  submit: null,
  skip: "Skip",
  next: "Next",
  finish: null,
};

export function OnboardingPage({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  user,
}: Props) {
  const router = useRouter();
  const [hasTeam, setHasTeam] = useState(!!user.teamId);
  const [hasFullName, setHasFullName] = useState(!!user.fullName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [bankSync, setBankSync] = useState<BankSyncState>(null);
  const [inboxSync, setInboxSync] = useState<InboxSyncState>(null);
  const [syncVisible, setSyncVisible] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [connectionParams, setConnectionParams] = useQueryStates({
    connected: parseAsString,
    provider: parseAsString,
    countryCode: parseAsString,
  });

  const { step, stepKey, nextStep, prevStep, totalSteps } = useOnboardingStep({
    hasTeam,
    hasFullName,
  });

  const { trackNavigation, trackEvent } = useOnboardingTracking(step);

  useEffect(() => {
    if (
      connectionParams.connected === "true" &&
      connectionParams.provider &&
      !inboxSync
    ) {
      setInboxSync({ provider: connectionParams.provider });
      trackEvent(LogEvents.OnboardingInboxConnected, {
        provider: connectionParams.provider,
      });
      setConnectionParams({ connected: null, provider: null });
    }
  }, [connectionParams, inboxSync, setConnectionParams, trackEvent]);

  const defaultCountryCode = use(defaultCountryCodePromise);

  const handleCountryChange = useCallback(
    (countryCode: string) => {
      setConnectionParams({
        countryCode: countryCode === defaultCountryCode ? null : countryCode,
      });
      queryClient.prefetchQuery(
        trpc.institutions.get.queryOptions({
          q: "",
          countryCode,
        }),
      );
    },
    [defaultCountryCode, setConnectionParams, queryClient, trpc],
  );

  const handleTeamCreated = useCallback(() => {
    setHasTeam(true);
    nextStep();
  }, [nextStep]);

  const handleNameSet = useCallback(() => {
    setHasFullName(true);
    nextStep();
  }, [nextStep]);

  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsSubmitting(loading);
  }, []);

  const handleBankSyncStarted = useCallback(
    (data: { runId: string; accessToken: string }) => {
      setBankSync(data);
      trackEvent(LogEvents.OnboardingBankConnected);
    },
    [trackEvent],
  );

  const steps: StepConfig[] = useMemo(
    () => [
      // Step 1 — Profile (name + avatar). Skipped via minStep when hasFullName.
      {
        key: "set-name",
        animation: <DashboardImageAnimation />,
        content: (
          <SetNameStep
            userId={user.id}
            avatarUrl={user.avatarUrl}
            onComplete={handleNameSet}
            onLoadingChange={handleLoadingChange}
          />
        ),
        overlay: true,
        navigation: "submit" as const,
      },
      // Step 2 — Business details / create team. Skipped via minStep when hasTeam.
      {
        key: "create-team",
        animation: <DashboardImageAnimation />,
        content: (
          <CreateTeamStep
            defaultCurrencyPromise={defaultCurrencyPromise}
            defaultCountryCodePromise={defaultCountryCodePromise}
            onComplete={handleTeamCreated}
            onCountryChange={handleCountryChange}
            onLoadingChange={handleLoadingChange}
          />
        ),
        overlay: true,
        navigation: "submit" as const,
      },
      // Step 3
      {
        key: "connect-bank",
        animation: <WidgetsAnimation />,
        content: (
          <ConnectBankStep
            onContinue={nextStep}
            defaultCountryCodePromise={defaultCountryCodePromise}
            onSyncStarted={handleBankSyncStarted}
          />
        ),
        navigation: "skip",
        trackEvent: LogEvents.OnboardingBankSkipped,
      },
      // Step 4
      {
        key: "connect-inbox",
        animation: <ReceiptAttachmentAnimation />,
        content: <ConnectInboxStep />,
        navigation: "skip",
        canGoBack: true,
        trackEvent: LogEvents.OnboardingInboxSkipped,
      },
      // Step 5
      {
        key: "reconciliation",
        animation: <BulkReconciliationAnimation />,
        content: <ReconciliationStep />,
        navigation: "next",
        canGoBack: true,
        trackEvent: LogEvents.OnboardingStepCompleted,
      },
      // Step 6
      {
        key: "start-trial",
        animation: <DashboardImageAnimation />,
        content: <StartTrialStep />,
        overlay: true,
        navigation: "finish",
        canGoBack: true,
      },
    ],
    [
      user.id,
      user.avatarUrl,
      defaultCurrencyPromise,
      defaultCountryCodePromise,
      handleTeamCreated,
      handleNameSet,
      handleCountryChange,
      handleLoadingChange,
      handleBankSyncStarted,
      nextStep,
    ],
  );

  const currentStep = steps[step - 1];

  // Prefetch the dashboard route as soon as the user reaches the final step
  useEffect(() => {
    if (currentStep?.navigation === "finish") {
      router.prefetch("/");
    }
  }, [currentStep?.navigation, router]);

  if (!currentStep) return null;

  const navLabel = NAV_LABELS[currentStep.navigation];

  const handleNavigation = () => {
    trackNavigation(currentStep);
    nextStep();
  };

  return (
    <div className="h-screen overflow-hidden flex relative">
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between">
          <div className="w-6 h-6">
            <Icons.LogoSmall className="w-full h-full text-foreground" />
          </div>
          <div className="pointer-events-auto">
            <OnboardingUserMenu />
          </div>
        </div>
      </nav>

      {/* Left Side - Animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#f7f7f7] dark:bg-[#080808] items-center justify-center p-8 m-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full h-full max-w-[500px] max-h-[700px]"
          >
            {currentStep.animation}
          </motion.div>
        </AnimatePresence>

        {currentStep.overlay && <GradientOverlay />}
      </div>

      {/* Right Side - Onboarding content */}
      <div className="w-full lg:w-1/2 flex flex-col items-center p-8 lg:p-12 pt-10 dark:bg-[#0c0c0c] text-foreground">
        <div className="w-full max-w-md flex flex-col h-full relative">
          <div className="relative h-6 mb-2">
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <OnboardingSyncStatus
                bankSync={bankSync}
                inboxSync={inboxSync}
                onVisibilityChange={setSyncVisible}
              />
            </div>
            {!syncVisible && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ProgressBar currentStep={step} totalSteps={totalSteps} />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center pt-20 min-h-0">
            <motion.div
              layout
              transition={{ layout: { duration: 0.3, ease: "easeInOut" } }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepKey}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    opacity: { duration: 0.2 },
                    layout: { duration: 0.3, ease: "easeInOut" },
                  }}
                >
                  {currentStep.content}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation Buttons - Bottom */}
          {currentStep.navigation !== "none" && (
            <div className="mt-auto pt-8">
              {currentStep.navigation === "submit" ? (
                <div className="flex justify-end">
                  <SubmitButton
                    type="submit"
                    form={`${currentStep.key}-form`}
                    isSubmitting={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                  >
                    Continue
                  </SubmitButton>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    {currentStep.canGoBack && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="px-4 py-2 bg-secondary border border-border text-foreground text-sm hover:bg-accent transition-colors"
                      >
                        Previous
                      </button>
                    )}
                  </div>

                  <div>
                    {navLabel && (
                      <button
                        type="button"
                        onClick={handleNavigation}
                        className="px-4 py-2 bg-secondary border border-border text-foreground text-sm hover:bg-accent transition-colors"
                      >
                        {navLabel}
                      </button>
                    )}
                    {currentStep.navigation === "finish" && (
                      <SubmitButton
                        isSubmitting={isFinishing}
                        onClick={async () => {
                          setIsFinishing(true);
                          trackEvent(LogEvents.OnboardingCompleted);
                          router.push("/");
                          await new Promise((r) => setTimeout(r, 5000));
                        }}
                        className="px-4 py-2 bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors border border-primary"
                      >
                        Get started
                      </SubmitButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
