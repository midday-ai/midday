"use client";

import { useBrandingMutation } from "@/hooks/use-branding-mutation";
import { useTeamQuery } from "@/hooks/use-team";
import { useTRPC } from "@/trpc/client";
import type { DocumentSigner, DocumentSignerConfig, TeamBranding } from "@db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

const DOCUMENT_TYPES = [
  {
    key: "collectionsNotices" as const,
    label: "Collections notices",
    description: "Default, delinquency, and demand letters",
  },
  {
    key: "payoffLetters" as const,
    label: "Payoff letters",
    description: "Payoff amount confirmations",
  },
  {
    key: "disclosureDocuments" as const,
    label: "Disclosure documents",
    description: "State-compliant MCA disclosures",
  },
  {
    key: "deals" as const,
    label: "Deals",
    description: "Payment deals and statements",
  },
];

const NONE_VALUE = "__none__";

export function DocumentSigners() {
  const { data: team } = useTeamQuery();
  const branding = (team?.branding as TeamBranding) ?? {};
  const brandingMutation = useBrandingMutation();

  const trpc = useTRPC();
  const { data: members } = useQuery(trpc.team.members.queryOptions());

  const [signers, setSigners] = useState<DocumentSignerConfig>(
    branding.documentSigners ?? {},
  );

  const updateSigner = (
    docType: keyof DocumentSignerConfig,
    patch: Partial<DocumentSigner> | null,
  ) => {
    setSigners((prev) => {
      if (patch === null) {
        const next = { ...prev };
        delete next[docType];
        return next;
      }
      return {
        ...prev,
        [docType]: { ...prev[docType], ...patch },
      };
    });
  };

  const onSave = () => {
    brandingMutation.mutate({ documentSigners: signers });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document signers</CardTitle>
        <CardDescription>
          Choose which team member signs each type of outbound document.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {DOCUMENT_TYPES.map((docType) => {
          const signer = signers[docType.key];

          return (
            <div key={docType.key} className="space-y-3">
              <div>
                <Label className="text-sm font-medium">{docType.label}</Label>
                <p className="text-xs text-muted-foreground">
                  {docType.description}
                </p>
              </div>

              <div className="flex flex-wrap items-start gap-3">
                <Select
                  value={signer?.userId ?? NONE_VALUE}
                  onValueChange={(value) => {
                    if (value === NONE_VALUE) {
                      updateSigner(docType.key, null);
                    } else {
                      updateSigner(docType.key, { userId: value });
                    }
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select signer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {members?.map(({ user }) => (
                      <SelectItem key={user?.id} value={user?.id ?? ""}>
                        {user?.fullName ?? user?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {signer?.userId && (
                  <>
                    <Input
                      value={signer.signerTitle ?? ""}
                      onChange={(e) =>
                        updateSigner(docType.key, {
                          signerTitle: e.target.value,
                        })
                      }
                      placeholder="Title (e.g. VP of Collections)"
                      className="w-[200px] text-sm"
                      maxLength={100}
                    />
                    <Input
                      value={signer.signatureLineText ?? ""}
                      onChange={(e) =>
                        updateSigner(docType.key, {
                          signatureLineText: e.target.value,
                        })
                      }
                      placeholder="Signature line text"
                      className="w-[200px] text-sm"
                      maxLength={200}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>Assign a signer to each document type.</div>
        <SubmitButton
          isSubmitting={brandingMutation.isPending}
          disabled={brandingMutation.isPending}
          onClick={onSave}
        >
          Save
        </SubmitButton>
      </CardFooter>
    </Card>
  );
}
