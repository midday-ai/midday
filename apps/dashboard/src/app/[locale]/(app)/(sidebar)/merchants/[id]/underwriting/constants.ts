// Shared underwriting display constants

export const STATUS_BADGE_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  review_needed: "bg-amber-50 text-amber-700 border-amber-200",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  scoring: "bg-amber-50 text-amber-700 border-amber-200",
  pending_documents: "bg-gray-100 text-gray-600 border-gray-200",
};

export const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  declined: "Declined",
  review_needed: "Review Needed",
  in_review: "In Review",
  scoring: "Scoring",
  pending_documents: "Pending Documents",
};

export const RECOMMENDATION_STYLES: Record<string, string> = {
  approve: "bg-green-100 text-green-800 border-green-200",
  decline: "bg-red-100 text-red-800 border-red-200",
  review_needed: "bg-amber-50 text-amber-700 border-amber-200",
};

export const RECOMMENDATION_LABELS: Record<string, string> = {
  approve: "Approve",
  decline: "Decline",
  review_needed: "Review Needed",
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
