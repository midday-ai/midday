"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";

const requirements = [
  { key: "address", label: "Company address", hash: "#address" },
  { key: "vat", label: "VAT number", hash: "#vat" },
  { key: "country", label: "Country", hash: "#address" },
] as const;

export function EInvoiceRegistration() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
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
    vat: Boolean(team?.vatNumber),
    country: Boolean(team?.countryCode),
  };

  const hasRequiredData = Object.values(completedFields).every(Boolean);
  const status = registration?.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle>E-Invoicing</CardTitle>
        <CardDescription>
          Send compliant electronic invoices via the Peppol network, accepted
          for B2B invoicing in over 30 countries worldwide.{" "}
          <a
            href="https://midday.ai/docs/e-invoicing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Learn more
          </a>
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : status === "registered" ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">E-invoicing is active</p>
            {registration?.peppolId && (
              <p className="text-sm text-muted-foreground">
                Peppol ID: {registration.peppolId}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Invoices are automatically submitted for e-invoicing when sent.
            </p>
          </div>
        ) : status === "processing" ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Verification in progress</p>
            <p className="text-sm text-muted-foreground">
              This can take up to 72 hours. We'll notify you when it's ready.
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
        ) : status === "error" ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Setup failed</p>
            {registration?.faults?.map((fault, index) => (
              <p key={`fault-${index}`} className="text-sm text-destructive">
                {fault.message}
              </p>
            ))}
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
                          const el = document.querySelector(req.hash);
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
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

      {(!status || status === "error") && (
        <CardFooter className="flex justify-end">
          <SubmitButton
            isSubmitting={registerMutation.isPending}
            disabled={!hasRequiredData || registerMutation.isPending}
            onClick={() => registerMutation.mutate()}
            type="button"
          >
            {status === "error" ? "Retry setup" : "Set up e-invoicing"}
          </SubmitButton>
        </CardFooter>
      )}
    </Card>
  );
}
