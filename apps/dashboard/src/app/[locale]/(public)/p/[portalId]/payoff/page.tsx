"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { Spinner } from "@midday/ui/spinner";
import { formatAmount } from "@midday/utils/format";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { addBusinessDays, format } from "date-fns";
import { Suspense, use, useState } from "react";

export default function PayoffPage({
  params,
}: {
  params: Promise<{ portalId: string }>;
}) {
  const { portalId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <PayoffContent portalId={portalId} />
    </Suspense>
  );
}

function PayoffContent({ portalId }: { portalId: string }) {
  const trpc = useTRPC();
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationStep, setVerificationStep] = useState<
    "idle" | "email" | "token" | "verified"
  >("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");

  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  const { data: payoffRequests = [] } = useQuery(
    trpc.merchantPortal.getPayoffRequestsByPortal.queryOptions({ portalId }),
  );

  const requestVerification = useMutation(
    trpc.merchantPortal.requestVerification.mutationOptions(),
  );

  const verifyToken = useMutation(
    trpc.merchantPortal.verifyToken.mutationOptions(),
  );

  const requestPayoff = useMutation(
    trpc.merchantPortal.requestPayoffLetter.mutationOptions(),
  );

  if (!portalData) return null;

  const { deals } = portalData;
  const activeDeals = deals.filter((d) => d.status === "active");
  const goodThroughDate = addBusinessDays(new Date(), 5);

  const handleRequestVerification = async () => {
    if (!verificationEmail) return;
    try {
      await requestVerification.mutateAsync({
        portalId,
        email: verificationEmail,
      });
      setVerificationStep("token");
    } catch {
      // Error handled by mutation state
    }
  };

  const handleVerifyToken = async () => {
    if (!tokenInput) return;
    try {
      const result = await verifyToken.mutateAsync({ token: tokenInput });
      if (result.success) {
        setSessionId(result.sessionId);
        setVerificationStep("verified");
      }
    } catch {
      // Error handled by mutation state
    }
  };

  const handleRequestPayoff = async (dealId: string) => {
    if (!sessionId) return;
    try {
      await requestPayoff.mutateAsync({
        sessionId,
        dealId,
        requestedPayoffDate: format(goodThroughDate, "yyyy-MM-dd"),
      });
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-serif">Request Payoff</h1>

      {/* Payoff amounts for each active deal */}
      {activeDeals.map((deal) => (
        <Card key={deal.id}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Deal</span>
              <span className="text-sm font-medium">{deal.dealCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current Balance
              </span>
              <span className="text-lg font-bold font-mono">
                {formatAmount({
                  amount: deal.currentBalance,
                  currency: "USD",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Payoff Amount
              </span>
              <span className="text-lg font-bold font-mono text-primary">
                {formatAmount({
                  amount: deal.currentBalance,
                  currency: "USD",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Good Through
              </span>
              <span className="text-sm">
                {format(goodThroughDate, "MMMM d, yyyy")}
              </span>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              Your payoff amount is the remaining balance. There is no
              additional discount or penalty for early payoff.
            </div>

            {/* Request button */}
            {verificationStep === "verified" && sessionId ? (
              <Button
                onClick={() => handleRequestPayoff(deal.id)}
                disabled={requestPayoff.isPending}
                className="w-full min-h-[48px] text-base"
                size="lg"
              >
                {requestPayoff.isPending ? (
                  <Spinner size={16} className="mr-2" />
                ) : null}
                Request Payoff Letter
              </Button>
            ) : (
              <Button
                onClick={() => setVerificationStep("email")}
                variant="outline"
                className="w-full min-h-[48px] text-base"
                size="lg"
              >
                Verify Email to Request
              </Button>
            )}

            {requestPayoff.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start gap-2">
                <Icons.Check className="h-4 w-4 mt-0.5" />
                <span>
                  Payoff letter requested! You will receive it via email.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Email verification form */}
      {verificationStep === "email" && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-sm font-medium">Verify Your Email</h3>
            <p className="text-sm text-muted-foreground">
              Enter the email address on file for your account to receive a
              verification code.
            </p>
            <input
              type="email"
              value={verificationEmail}
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg min-h-[44px]"
            />
            {requestVerification.isError && (
              <p className="text-sm text-red-600">
                {requestVerification.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleRequestVerification}
                disabled={
                  requestVerification.isPending || !verificationEmail
                }
                className="min-h-[44px]"
              >
                {requestVerification.isPending ? (
                  <Spinner size={16} className="mr-2" />
                ) : null}
                Send Code
              </Button>
              <Button
                variant="ghost"
                onClick={() => setVerificationStep("idle")}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token input form */}
      {verificationStep === "token" && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="text-sm font-medium">Enter Verification Code</h3>
            <p className="text-sm text-muted-foreground">
              Check your email for a verification link or paste the code below.
            </p>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste verification code"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg min-h-[44px]"
            />
            {verifyToken.isError && (
              <p className="text-sm text-red-600">
                {verifyToken.error.message}
              </p>
            )}
            <Button
              onClick={handleVerifyToken}
              disabled={verifyToken.isPending || !tokenInput}
              className="min-h-[44px]"
            >
              {verifyToken.isPending ? (
                <Spinner size={16} className="mr-2" />
              ) : null}
              Verify
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing payoff requests status tracker */}
      {payoffRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Previous Requests</h2>
          {payoffRequests.map((req: any) => (
            <Card key={req.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">
                    {req.dealCode || "Deal"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
                  </span>
                </div>

                {/* Status tracker */}
                <div className="flex items-center gap-2">
                  <StatusStep
                    label="Requested"
                    active={true}
                    completed={
                      req.status === "approved" || req.status === "sent"
                    }
                  />
                  <div className="flex-1 h-px bg-border" />
                  <StatusStep
                    label="Generated"
                    active={
                      req.status === "approved" || req.status === "sent"
                    }
                    completed={req.status === "sent"}
                  />
                  <div className="flex-1 h-px bg-border" />
                  <StatusStep
                    label="Sent"
                    active={req.status === "sent"}
                    completed={false}
                  />
                </div>

                {req.status === "rejected" && (
                  <div className="mt-2 text-xs text-red-600">
                    This request was declined
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`h-3 w-3 rounded-full ${
          completed
            ? "bg-green-500"
            : active
              ? "bg-primary"
              : "bg-muted-foreground/30"
        }`}
      />
      <span
        className={`text-[10px] ${
          active ? "text-foreground font-medium" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
