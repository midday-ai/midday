"use client";

import { useTRPC } from "@/trpc/client";
import { createClient } from "@midday/supabase/client";
import { upload } from "@midday/supabase/storage";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useUnderwritingWizard } from "../wizard-context";

type Props = {
  merchantState?: string | null;
  teamId: string;
};

type UploadStatus = {
  requirementId: string;
  status: "idle" | "uploading" | "uploaded" | "waived" | "error";
  fileName?: string;
  error?: string;
};

export function StepDocuments({ merchantState, teamId }: Props) {
  const { state, nextStep, prevStep, setDocuments } =
    useUnderwritingWizard();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const applicationId = state.applicationId;

  const [uploadStatuses, setUploadStatuses] = useState<
    Record<string, UploadStatus>
  >({});

  // Fetch document requirements
  const { data: requirements, isLoading: requirementsLoading } = useQuery(
    trpc.underwritingApplications.getRequirements.queryOptions(),
  );

  // Fetch already-uploaded documents
  const { data: existingDocs } = useQuery({
    ...trpc.underwritingApplications.getDocuments.queryOptions({
      applicationId: applicationId!,
    }),
    enabled: !!applicationId,
  });

  const uploadDocMutation = useMutation(
    trpc.underwritingApplications.uploadDocument.mutationOptions({
      onSuccess: () => {
        if (applicationId) {
          queryClient.invalidateQueries({
            queryKey:
              trpc.underwritingApplications.getDocuments.queryKey(),
          });
        }
      },
    }),
  );

  const waiveDocMutation = useMutation(
    trpc.underwritingApplications.updateDocument.mutationOptions({
      onSuccess: () => {
        if (applicationId) {
          queryClient.invalidateQueries({
            queryKey:
              trpc.underwritingApplications.getDocuments.queryKey(),
          });
        }
      },
    }),
  );

  // Filter requirements by merchant state
  const filteredRequirements = useMemo(() => {
    if (!requirements) return [];
    return requirements.filter((req) => {
      const states = req.appliesToStates as string[] | null;
      if (!states || states.length === 0) return true;
      if (!merchantState) return true;
      return states.includes(merchantState);
    });
  }, [requirements, merchantState]);

  // Build map of requirement -> uploaded document
  const docsByRequirement = useMemo(() => {
    const map: Record<string, (typeof existingDocs extends (infer T)[] | undefined ? T : never)> = {};
    if (existingDocs) {
      for (const doc of existingDocs) {
        if (doc.requirementId) {
          map[doc.requirementId] = doc;
        }
      }
    }
    return map;
  }, [existingDocs]);

  const handleFileUpload = useCallback(
    async (requirementId: string, file: File) => {
      if (!applicationId) return;

      setUploadStatuses((prev) => ({
        ...prev,
        [requirementId]: {
          requirementId,
          status: "uploading",
          fileName: file.name,
        },
      }));

      try {
        const supabase = createClient();
        const filePath = [
          teamId,
          "underwriting",
          applicationId,
          file.name,
        ];

        await upload(supabase, {
          path: filePath,
          file,
          bucket: "vault",
        });

        await uploadDocMutation.mutateAsync({
          applicationId,
          requirementId,
          filePath: filePath.join("/"),
          fileName: file.name,
          fileSize: file.size,
          documentType: file.type,
        });

        setUploadStatuses((prev) => ({
          ...prev,
          [requirementId]: {
            requirementId,
            status: "uploaded",
            fileName: file.name,
          },
        }));
      } catch (err) {
        setUploadStatuses((prev) => ({
          ...prev,
          [requirementId]: {
            requirementId,
            status: "error",
            error:
              err instanceof Error ? err.message : "Upload failed",
          },
        }));
      }
    },
    [applicationId, teamId, uploadDocMutation],
  );

  const handleWaive = useCallback(
    async (requirementId: string) => {
      const doc = docsByRequirement[requirementId];
      if (doc) {
        // If there's an existing doc record, mark it as waived
        await waiveDocMutation.mutateAsync({
          id: doc.id,
          waived: true,
          waiveReason: "Waived during underwriting wizard",
        });
      }
      setUploadStatuses((prev) => ({
        ...prev,
        [requirementId]: {
          requirementId,
          status: "waived",
        },
      }));
    },
    [docsByRequirement, waiveDocMutation],
  );

  // Check if all required documents are uploaded or waived
  const allRequiredSatisfied = useMemo(() => {
    return filteredRequirements
      .filter((req) => req.required)
      .every((req) => {
        const uploaded = docsByRequirement[req.id];
        const localStatus = uploadStatuses[req.id];
        return (
          uploaded !== undefined ||
          localStatus?.status === "uploaded" ||
          localStatus?.status === "waived"
        );
      });
  }, [filteredRequirements, docsByRequirement, uploadStatuses]);

  const handleContinue = () => {
    const uploadedCount = Object.values(uploadStatuses).filter(
      (s) => s.status === "uploaded",
    ).length + (existingDocs?.length ?? 0);

    setDocuments({
      applicationId: applicationId!,
      documentsUploaded: uploadedCount,
    });
    nextStep();
  };

  if (!applicationId) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#878787]">
          Please complete the profile step first.
        </p>
      </div>
    );
  }

  if (requirementsLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#878787]">Loading requirements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium">Document Upload</h3>
        <p className="text-xs text-[#878787] mt-1">
          Upload the required documents for underwriting review.
        </p>
      </div>

      {filteredRequirements.length === 0 ? (
        <div className="border border-border p-6 text-center">
          <p className="text-sm text-[#878787]">
            No document requirements configured. You can continue to the
            review step.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequirements.map((req) => {
            const existingDoc = docsByRequirement[req.id];
            const localStatus = uploadStatuses[req.id];
            const isUploaded =
              existingDoc !== undefined || localStatus?.status === "uploaded";
            const isWaived =
              existingDoc?.waived || localStatus?.status === "waived";
            const isUploading = localStatus?.status === "uploading";
            const hasError = localStatus?.status === "error";

            return (
              <div
                key={req.id}
                className="border border-border p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{req.name}</span>
                      {req.required ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Required
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Optional
                        </Badge>
                      )}
                      {isUploaded && (
                        <Badge
                          className="text-[10px] bg-green-100 text-green-800 border-green-200"
                        >
                          Uploaded
                        </Badge>
                      )}
                      {isWaived && (
                        <Badge variant="outline" className="text-[10px]">
                          Waived
                        </Badge>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-xs text-[#878787] mt-1">
                        {req.description}
                      </p>
                    )}
                  </div>
                </div>

                {!isUploaded && !isWaived && (
                  <div className="flex items-center gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(req.id, file);
                          }
                        }}
                      />
                      <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-[#878787]">
                        {isUploading ? (
                          <>
                            <Icons.Refresh className="size-4 animate-spin" />
                            <span>
                              Uploading {localStatus?.fileName}...
                            </span>
                          </>
                        ) : (
                          <>
                            <Icons.ArrowUpward className="size-4" />
                            <span>Choose PDF file</span>
                          </>
                        )}
                      </div>
                    </label>

                    {!req.required && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleWaive(req.id)}
                      >
                        Waive
                      </Button>
                    )}
                  </div>
                )}

                {isUploaded && (
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <Icons.Check className="size-3.5" />
                    <span>
                      {localStatus?.fileName ||
                        existingDoc?.fileName ||
                        "Document uploaded"}
                    </span>
                  </div>
                )}

                {hasError && (
                  <div className="text-xs text-red-600">
                    {localStatus?.error || "Upload failed. Please try again."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={!allRequiredSatisfied}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
