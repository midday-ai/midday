"use client";

import * as React from "react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Textarea } from "./textarea";
import { cn } from "../utils";

// Types for the feedback submission
export type FeedbackType = "bug" | "feedback" | "support";

export interface FeedbackSubmission {
  type: FeedbackType;
  title: string;
  description: string;
  source: string;
  userEmail?: string;
  userAgent?: string;
  url?: string;
}

export interface FeedbackWidgetProps {
  /** Source identifier (e.g., "dashboard", "merchant-portal", "website") */
  source: string;
  /** Optional user email to include with submission */
  userEmail?: string;
  /** API endpoint to submit feedback to */
  apiEndpoint?: string;
  /** Callback when feedback is submitted */
  onSubmit?: (feedback: FeedbackSubmission) => Promise<void>;
  /** Custom trigger element */
  trigger?: React.ReactNode;
  /** Position for the floating trigger button */
  position?: "bottom-right" | "bottom-left" | "inline";
  /** Additional class name for the trigger */
  className?: string;
}

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "🐛 Bug Report" },
  { value: "feedback", label: "💡 Feature Request" },
  { value: "support", label: "🙋 Support" },
];

export function FeedbackWidget({
  source,
  userEmail,
  apiEndpoint = "/api/support/ticket",
  onSubmit,
  trigger,
  position = "bottom-right",
  className,
}: FeedbackWidgetProps) {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<FeedbackType>("feedback");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = () => {
    setType("feedback");
    setTitle("");
    setDescription("");
    setError(null);
    setSubmitted(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const feedback: FeedbackSubmission = {
      type,
      title: title || `${FEEDBACK_TYPES.find((t) => t.value === type)?.label} from ${source}`,
      description,
      source,
      userEmail,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    try {
      if (onSubmit) {
        await onSubmit(feedback);
      } else {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        });

        if (!response.ok) {
          throw new Error("Failed to submit feedback");
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionClasses = {
    "bottom-right": "fixed bottom-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    inline: "",
  };

  const defaultTrigger = (
    <Button
      variant="default"
      size="default"
      className={cn(
        "gap-2 rounded-full shadow-lg",
        positionClasses[position],
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      Feedback
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">Thank you!</h3>
            <p className="text-muted-foreground">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send Feedback</DialogTitle>
              <DialogDescription>
                Help us improve by sharing your thoughts
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={type} onValueChange={(v) => setType(v as FeedbackType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPES.map((feedbackType) => (
                      <SelectItem key={feedbackType.value} value={feedbackType.value}>
                        {feedbackType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label htmlFor="feedback-title" className="text-sm font-medium">
                  Title{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  id="feedback-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary..."
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="feedback-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="feedback-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more..."
                  required
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full"
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

FeedbackWidget.displayName = "FeedbackWidget";
