"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  GeminiMcpLogo,
  MakeMcpLogo,
  ManusMcpLogo,
  N8nMcpLogo,
  PerplexityMcpLogo,
  RaycastMcpLogo,
  WindsurfMcpLogo,
  ZapierMcpLogo,
} from "@midday/app-store/logos";
import { LogEvents } from "@midday/events/events";
import { BulkReconciliationAnimation } from "@midday/ui/animations/bulk-reconciliation";
import { ReceiptAttachmentAnimation } from "@midday/ui/animations/receipt-attachment";
import { WidgetsAnimation } from "@midday/ui/animations/widgets";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryStates } from "nuqs";
import type { ReactNode } from "react";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import { AppDetailSheet } from "@/components/sheets/app-detail-sheet";
import { useOnboardingStep } from "@/hooks/use-onboarding-step";
import { useOnboardingTracking } from "@/hooks/use-onboarding-tracking";
import { useTRPC } from "@/trpc/client";
import { ChatDemoWithRail } from "./chat-demo-with-rail";
import {
  type BankSyncState,
  type InboxSyncState,
  OnboardingSyncStatus,
} from "./onboarding-sync-status";
import { OnboardingUserMenu } from "./onboarding-user-menu";
import { ConnectBankStep } from "./steps/connect-bank-step";
import { ConnectChatStep } from "./steps/connect-chat-step";
import { ConnectInboxStep } from "./steps/connect-inbox-step";
import { ConnectMcpStep } from "./steps/connect-mcp-step";
import { CreateTeamStep } from "./steps/create-team-step";
import { ReconciliationStep } from "./steps/reconciliation-step";
import { SetNameStep } from "./steps/set-name-step";
import { StartTrialStep } from "./steps/start-trial-step";

type StepConfig = {
  key: string;
  animation: ReactNode;
  content: ReactNode;
  overlay?: boolean;
  navigation: "none" | "submit" | "skip" | "next";
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

function McpAnimation() {
  const allLogos: {
    Logo: React.ComponentType<Record<string, unknown>>;
    size: number;
  }[] = [
    { Logo: ChatGPTMcpLogo, size: 68 },
    { Logo: ZapierMcpLogo, size: 48 },
    { Logo: CursorMcpLogo, size: 56 },
    { Logo: MakeMcpLogo, size: 48 },
    { Logo: ClaudeMcpLogo, size: 68 },
    { Logo: N8nMcpLogo, size: 48 },
    { Logo: WindsurfMcpLogo, size: 56 },
    { Logo: RaycastMcpLogo, size: 48 },
    { Logo: PerplexityMcpLogo, size: 56 },
    { Logo: ManusMcpLogo, size: 48 },
    { Logo: CopilotMcpLogo, size: 56 },
    { Logo: GeminiMcpLogo, size: 48 },
  ];

  const count = allLogos.length;
  const radius = 155;
  const icons = allLogos.map(({ Logo, size }, i) => {
    const angle = -90 + (i * 360) / count;
    const rad = (angle * Math.PI) / 180;
    return {
      Logo,
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
      rotate: (i % 2 === 0 ? 1 : -1) * (3 + (i % 4)),
      size,
      delay: 0.15 + i * 0.06,
    };
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />
      <div className="relative z-10" style={{ width: 400, height: 400 }}>
        {icons.map(({ Logo, x, y, rotate, size, delay }, i) => (
          <motion.div
            key={`mcp-icon-${i.toString()}`}
            initial={{ opacity: 0, scale: 0, rotate: rotate * 2 }}
            animate={{ opacity: 1, scale: 1, rotate }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 180,
              delay,
            }}
            className="absolute mcp-onboarding-icon overflow-hidden rounded-xl border border-border bg-background shadow-sm"
            style={{
              width: size,
              height: size,
              left: "50%",
              top: "50%",
              marginLeft: x - size / 2,
              marginTop: y - size / 2,
            }}
          >
            <Logo />
          </motion.div>
        ))}
        <style>
          {
            ".mcp-onboarding-icon img, .mcp-onboarding-icon svg { width: 100% !important; height: 100% !important; }"
          }
        </style>
      </div>
    </div>
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
  hasOtherTeams: boolean;
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
};

export function OnboardingPage({
  defaultCurrencyPromise,
  defaultCountryCodePromise,
  hasOtherTeams,
  user,
}: Props) {
  const router = useRouter();
  const [hasTeam, setHasTeam] = useState(!!user.teamId);
  const [hasFullName, setHasFullName] = useState(!!user.fullName);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      // Step 6 — Connect AI tools via MCP
      {
        key: "connect-mcp",
        animation: <McpAnimation />,
        content: <ConnectMcpStep />,
        navigation: "next",
        canGoBack: true,
        trackEvent: LogEvents.OnboardingStepCompleted,
      },
      // Step 7 — Connect chat platforms (iMessage, WhatsApp, Slack, Telegram)
      {
        key: "connect-chat",
        animation: <ChatDemoWithRail />,
        content: <ConnectChatStep />,
        navigation: "skip",
        canGoBack: true,
        trackEvent: LogEvents.OnboardingStepCompleted,
      },
      // Step 8 — Plan selection + Polar checkout with CC-required trial
      {
        key: "start-trial",
        animation: <DashboardImageAnimation />,
        content: <StartTrialStep />,
        overlay: true,
        navigation: "none",
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
    if (currentStep?.key === "start-trial") {
      router.prefetch("/");
    }
  }, [currentStep?.key, router]);

  if (!currentStep) return null;

  const navLabel = NAV_LABELS[currentStep.navigation];

  const handleNavigation = () => {
    trackNavigation(currentStep);
    nextStep();
  };

  return (
    <div className="h-screen overflow-hidden flex relative">
      <AppDetailSheet />
      <nav className="fixed top-0 left-0 right-0 z-50 w-full pointer-events-none">
        <div className="relative py-3 xl:py-4 px-4 sm:px-4 md:px-4 lg:px-4 xl:px-6 2xl:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6">
              <Icons.LogoSmall className="w-full h-full text-foreground" />
            </div>
            {hasOtherTeams && (
              <Link
                href="/teams"
                className="pointer-events-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Select team
              </Link>
            )}
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

          <div className="flex-1 flex flex-col justify-center pt-20 min-h-0 overflow-y-auto scrollbar-hide">
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
                        {currentStep.key === "connect-bank" ||
                        currentStep.key === "connect-inbox"
                          ? "Skip for now"
                          : navLabel}
                      </button>
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
