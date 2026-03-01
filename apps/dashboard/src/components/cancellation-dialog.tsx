"use client";

import { track } from "@midday/events/client";
import { LogEvents } from "@midday/events/events";
import { getPlanPricing } from "@midday/plans";
import { AnimatedSizeContainer } from "@midday/ui/animated-size-container";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

type CancellationReason =
  | "too_expensive"
  | "missing_features"
  | "unused"
  | "switched_service"
  | "other";

type Step = 1 | 2 | 3 | "done";

const REASONS: { value: CancellationReason; label: string }[] = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "missing_features", label: "Missing a feature I need" },
  { value: "unused", label: "Not using it enough" },
  { value: "switched_service", label: "Switching to another tool" },
  { value: "other", label: "Other" },
];

const stepTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

type CancellationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancellationDialog({
  open,
  onOpenChange,
}: CancellationDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [comment, setComment] = useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const plan = user?.team?.plan;
  const theme = useTheme().resolvedTheme === "dark" ? "dark" : "light";
  const checkoutRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);

  useEffect(() => {
    PolarEmbedCheckout.init();
    return () => {
      checkoutRef.current?.close();
    };
  }, []);

  const createCheckoutMutation = useMutation(
    trpc.billing.createCheckout.mutationOptions(),
  );

  const cancelMutation = useMutation(
    trpc.billing.cancelSubscription.mutationOptions({
      onSuccess: () => {
        setStep("done");

        track({
          event: LogEvents.SubscriptionCanceled.name,
          channel: LogEvents.SubscriptionCanceled.channel,
          reason: reason!,
        });
      },
    }),
  );

  const reset = useCallback(() => {
    setStep(1);
    setReason(null);
    setComment("");
    cancelMutation.reset();
  }, [cancelMutation]);

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value) {
        if (step === "done") {
          queryClient.invalidateQueries({
            queryKey: trpc.user.me.queryKey(),
          });
        }
        setTimeout(reset, 200);
      }
      onOpenChange(value);
    },
    [step, onOpenChange, reset, queryClient, trpc],
  );

  const handleSwitchToAnnual = useCallback(async () => {
    if (!plan || plan === "trial") return;
    const planKey = plan as "starter" | "pro";
    const planType = `${planKey}_yearly`;

    handleClose(false);

    try {
      const { url } = await createCheckoutMutation.mutateAsync({
        plan: planKey,
        planType,
        embedOrigin: window.location.origin,
      });

      const checkout = await PolarEmbedCheckout.create(url, theme);
      checkoutRef.current = checkout;

      checkout.addEventListener("success", (event: any) => {
        event.preventDefault();
        track({
          event: LogEvents.CheckoutCompleted.name,
          channel: LogEvents.CheckoutCompleted.channel,
          plan: planKey,
          planType,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.user.me.queryKey(),
        });
      });

      checkout.addEventListener("close", () => {
        checkoutRef.current = null;
      });
    } catch (error) {
      console.error("Failed to open checkout", error);
    }
  }, [plan, theme, handleClose, createCheckoutMutation, queryClient, trpc]);

  const handleReasonSelect = useCallback((value: CancellationReason) => {
    setReason(value);
    setStep(2);
  }, []);

  const handleCancel = useCallback(() => {
    if (!reason) return;
    cancelMutation.mutate({ reason, comment: comment || undefined });
  }, [reason, comment, cancelMutation]);

  const pricing = getPlanPricing();
  const annualSavings =
    plan === "pro"
      ? (pricing.pro.monthly - pricing.pro.yearly) * 12
      : (pricing.starter.monthly - pricing.starter.yearly) * 12;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md overflow-hidden" hideClose>
        <AnimatedSizeContainer height>
          <div className="p-6">
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.div key="step-1" {...stepTransition}>
                  <StepOne reason={reason} onSelect={handleReasonSelect} />
                </motion.div>
              )}

              {step === 2 && reason && (
                <motion.div key="step-2" {...stepTransition}>
                  <StepTwo
                    reason={reason}
                    comment={comment}
                    onCommentChange={setComment}
                    annualSavings={annualSavings}
                    currency={pricing.symbol}
                    onSwitchToAnnual={handleSwitchToAnnual}
                    onStillCancel={() => setStep(3)}
                    onBack={() => {
                      setReason(null);
                      setStep(1);
                    }}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step-3" {...stepTransition}>
                  <StepThree
                    isSubmitting={cancelMutation.isPending}
                    onConfirm={handleCancel}
                    onKeepPlan={() => handleClose(false)}
                    onBack={() => setStep(2)}
                  />
                </motion.div>
              )}

              {step === "done" && (
                <motion.div key="step-done" {...stepTransition}>
                  <StepDone onClose={() => handleClose(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </AnimatedSizeContainer>
      </DialogContent>
    </Dialog>
  );
}

function StepOne({
  reason,
  onSelect,
}: {
  reason: CancellationReason | null;
  onSelect: (value: CancellationReason) => void;
}) {
  return (
    <div>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-base font-medium mb-0">
          We'd love to understand why
        </DialogTitle>
        <DialogDescription>
          Your feedback helps us improve Midday for everyone.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        {REASONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={cn(
              "w-full text-left text-sm p-3 border transition-colors hover:bg-accent",
              reason === value ? "border-primary bg-accent" : "border-border",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTwo({
  reason,
  comment,
  onCommentChange,
  annualSavings,
  currency,
  onSwitchToAnnual,
  onStillCancel,
  onBack,
}: {
  reason: CancellationReason;
  comment: string;
  onCommentChange: (value: string) => void;
  annualSavings: number;
  currency: string;
  onSwitchToAnnual: () => void;
  onStillCancel: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-base font-medium mb-0">
          Before you go
        </DialogTitle>
      </DialogHeader>

      {reason === "too_expensive" && (
        <div className="space-y-4">
          <p className="text-sm text-[#878787]">
            You could save{" "}
            <span className="text-foreground font-medium">
              {currency}
              {annualSavings}/year
            </span>{" "}
            by{" "}
            <button
              type="button"
              onClick={onSwitchToAnnual}
              className="text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              switching to annual billing
            </button>
            .
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onStillCancel}
            >
              Still cancel
            </Button>
          </div>
        </div>
      )}

      {reason === "missing_features" && (
        <div className="space-y-4">
          <p className="text-sm text-[#878787]">
            What feature would have made Midday work for you? We read every
            response.
          </p>
          <Textarea
            placeholder="Tell us what you need..."
            className="resize-none h-[100px]"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onStillCancel}
            >
              Still cancel
            </Button>
          </div>
        </div>
      )}

      {reason === "unused" && (
        <div className="space-y-4">
          <p className="text-sm text-[#878787]">
            A few things you might not have tried yet:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="text-[#878787] shrink-0">-</span>
              <span>
                <span className="text-foreground font-medium">Inbox</span>{" "}
                <span className="text-[#878787]">
                  — forward receipts from Gmail or Outlook and match them
                  automatically
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#878787] shrink-0">-</span>
              <span>
                <span className="text-foreground font-medium">
                  Weekly insights
                </span>{" "}
                <span className="text-[#878787]">
                  — AI-powered summaries of your spending and revenue, delivered
                  every Monday
                </span>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#878787] shrink-0">-</span>
              <span>
                <span className="text-foreground font-medium">
                  Time tracking
                </span>{" "}
                <span className="text-[#878787]">
                  — track billable hours and turn them into invoices
                </span>
              </span>
            </li>
          </ul>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onStillCancel}
            >
              Still cancel
            </Button>
          </div>
        </div>
      )}

      {reason === "switched_service" && (
        <div className="space-y-4">
          <p className="text-sm text-[#878787]">
            Which tool are you switching to? This helps us understand where we
            can improve.
          </p>
          <Textarea
            placeholder="e.g. QuickBooks, Xero, Wave..."
            className="resize-none h-[60px]"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onStillCancel}
            >
              Submit and cancel
            </Button>
          </div>
        </div>
      )}

      {reason === "other" && (
        <div className="space-y-4">
          <p className="text-sm text-[#878787]">
            Anything you'd like us to know? We read every response.
          </p>
          <Textarea
            placeholder="Tell us more..."
            className="resize-none h-[100px]"
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={onStillCancel}
            >
              Submit and cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepThree({
  isSubmitting,
  onConfirm,
  onKeepPlan,
  onBack,
}: {
  isSubmitting: boolean;
  onConfirm: () => void;
  onKeepPlan: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-base font-medium mb-0">
          Confirm cancellation
        </DialogTitle>
        <DialogDescription>
          Your plan will remain active until the end of your current billing
          period. You won't be charged again.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <SubmitButton
          variant="destructive"
          className="w-full"
          isSubmitting={isSubmitting}
          onClick={onConfirm}
        >
          Confirm cancellation
        </SubmitButton>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onKeepPlan}
            disabled={isSubmitting}
          >
            Keep my plan
          </Button>
        </div>
      </div>
    </div>
  );
}

function StepDone({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <DialogHeader className="mb-6">
        <DialogTitle className="text-base font-medium mb-0">
          Subscription canceled
        </DialogTitle>
        <DialogDescription>
          Your plan remains active until the end of your billing period. Your
          data will be kept safe — you can resubscribe anytime.
        </DialogDescription>
      </DialogHeader>

      <Button className="w-full" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
