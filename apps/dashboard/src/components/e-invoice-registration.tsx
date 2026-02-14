"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CopyInput } from "@/components/copy-input";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";

const requirements = [
  { key: "address", label: "Company address", hash: "#address" },
  { key: "city", label: "City", hash: "#address" },
  { key: "zip", label: "Postal code", hash: "#address" },
  { key: "email", label: "Company email", hash: "#email" },
  { key: "vat", label: "VAT number", hash: "#vat" },
  { key: "country", label: "Country", href: "/settings" },
] as const;

export function EInvoiceRegistration() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const { data: team } = useTeamQuery();

  const { data: registration, isLoading } = useQuery(
    trpc.team.eInvoiceRegistration.queryOptions(),
  );

  const registerMutation = useMutation(
    trpc.team.registerForEInvoice.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.team.eInvoiceRegistration.queryKey(),
        });
        toast({
          title: "Setup started",
          description:
            "Your e-invoicing setup has been submitted. Verification typically takes up to 72 hours.",
        });
      },
      onError: (error) => {
        toast({
          title: "Setup failed",
          description: error.message,
          variant: "error",
        });
      },
    }),
  );

  const completedFields: Record<string, boolean> = {
    address: Boolean(team?.addressLine1),
    city: Boolean(team?.city),
    zip: Boolean(team?.zip),
    email: Boolean(team?.email),
    vat: Boolean(team?.vatNumber),
    country: Boolean(team?.countryCode),
  };

  const hasRequiredData = Object.values(completedFields).every(Boolean);
  const status = registration?.status;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>E-Invoicing</CardTitle>
          {status === "registered" && (
            <div className="text-green-600 bg-green-100 text-[10px] dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full font-mono">
              Active
            </div>
          )}
        </div>
        <CardDescription>
          Send compliant electronic invoices via the Peppol network, accepted
          for B2B invoicing in over 30 countries worldwide.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-[140px]" />
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-4 w-full max-w-[420px]" />
          </div>
        ) : status === "registered" ? (
          <div className="space-y-4">
            {registration?.peppolId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Peppol ID
                </p>
                <CopyInput
                  value={`${registration.peppolScheme ? `${registration.peppolScheme}:` : ""}${registration.peppolId}`}
                  className="max-w-[300px] font-mono"
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Invoices sent to customers with a Peppol ID will be automatically
              delivered via the Peppol network.
            </p>
          </div>
        ) : status === "processing" ? (
          <div className="space-y-3">
            <div className="px-3 py-3 border border-border">
              <p className="text-sm font-medium mb-1">
                Verification in progress
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Your registration is being reviewed by the Peppol network
                authority. This typically takes 1-3 business days. You'll
                receive an email when verification is complete.
              </p>

              {registration?.registrationUrl && (
                <a
                  href={registration.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Complete verification form &rarr;
                </a>
              )}
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="px-3 py-3 border border-border">
            <p className="text-sm font-medium mb-1">Submitting registration</p>
            <p className="text-sm text-muted-foreground">
              Your Peppol network registration is being submitted. This usually
              takes a few moments. If it stays in this state for more than a few
              minutes, you can retry.
            </p>
          </div>
        ) : status === "error" ? (
          <div className="px-3 py-3 border border-border">
            <p className="text-sm font-medium mb-1">
              Registration could not be completed
            </p>
            {registration?.faults?.map((fault, index) => (
              <p key={`fault-${index}`} className="text-sm text-destructive">
                {fault.message}
              </p>
            ))}
            <p className="text-sm text-muted-foreground mt-2">
              This is usually a temporary issue. You can retry, or contact
              support if the problem persists.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-border p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Requirements
              </p>
              {requirements.map((req) => {
                const done = completedFields[req.key];

                return (
                  <div key={req.key} className="flex items-center gap-3">
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        done ? "bg-primary" : "border border-border"
                      }`}
                    >
                      {done && (
                        <span className="text-primary-foreground text-[9px] leading-none">
                          &#10003;
                        </span>
                      )}
                    </div>
                    {done ? (
                      <span className="text-sm text-muted-foreground">
                        {req.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="text-sm text-foreground hover:underline text-left"
                        onClick={() => {
                          if ("href" in req) {
                            router.push(req.href);
                          } else {
                            const el = document.querySelector(req.hash);
                            el?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }
                        }}
                      >
                        {req.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {hasRequiredData && (
              <p className="text-sm text-muted-foreground">
                Verification typically takes up to 72 hours before you can start
                sending e-invoices.
              </p>
            )}
          </div>
        )}
      </CardContent>

      {(!status || status === "error" || status === "pending") && (
        <CardFooter className="flex justify-end">
          <SubmitButton
            isSubmitting={registerMutation.isPending}
            disabled={!hasRequiredData || registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
            type="button"
          >
            {status === "error" || status === "pending"
              ? "Retry setup"
              : "Set up e-invoicing"}
          </SubmitButton>
        </CardFooter>
      )}
    </Card>
  );
}
