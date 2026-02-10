"use client";

import { useChatActions, useChatId } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useAudioPlayerStore } from "@/store/audio-player";
import { useTRPC } from "@/trpc/client";

interface ChatMessageActionsProps {
  messageId: string;
  messageContent: string;
  /** Optional insight ID to enable audio playback */
  insightId?: string;
}

export function ChatMessageActions({
  messageId,
  messageContent,
  insightId,
}: ChatMessageActionsProps) {
  const chatId = useChatId();
  const { regenerate } = useChatActions();
  const [feedbackGiven, setFeedbackGiven] = useState<
    "positive" | "negative" | null
  >(null);
  const [copied, setCopied] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const playAudio = useAudioPlayerStore((state) => state.play);
  const audioFetchingRef = useRef(false);

  const createFeedbackMutation = useMutation(
    trpc.chatFeedback.create.mutationOptions(),
  );

  const deleteFeedbackMutation = useMutation(
    trpc.chatFeedback.delete.mutationOptions(),
  );

  const handleRegenerate = () => {
    regenerate?.();
  };

  const handlePositive = () => {
    if (feedbackGiven === "positive") {
      // Already gave positive feedback, remove feedback
      setFeedbackGiven(null);

      if (!chatId) return;

      deleteFeedbackMutation.mutate({
        chatId,
        messageId,
      });
      return;
    }

    setFeedbackGiven("positive");

    if (!chatId) return;

    createFeedbackMutation.mutate({
      chatId,
      messageId,
      type: "positive",
    });
  };

  const handleNegative = () => {
    if (feedbackGiven === "negative") {
      // Already gave negative feedback, remove feedback
      setFeedbackGiven(null);

      if (!chatId) return;

      deleteFeedbackMutation.mutate({
        chatId,
        messageId,
      });
      return;
    }

    setFeedbackGiven("negative");

    if (!chatId) return;

    createFeedbackMutation.mutate({
      chatId,
      messageId,
      type: "negative",
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handlePlayAudio = useCallback(async () => {
    if (!insightId || audioFetchingRef.current) return;

    audioFetchingRef.current = true;
    try {
      const result = await queryClient.fetchQuery(
        trpc.insights.audioUrl.queryOptions({ id: insightId }),
      );

      if (result.audioUrl) {
        playAudio(result.audioUrl);
      }
    } catch (error) {
      console.error("Failed to fetch audio URL:", error);
    } finally {
      audioFetchingRef.current = false;
    }
  }, [insightId, queryClient, trpc, playAudio]);

  return (
    <div className="flex items-center gap-1">
      {/* Listen Button - only show if there's an insight with potential audio */}
      {insightId && (
        <div>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handlePlayAudio}
                  className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
                >
                  <Icons.UnMute className="size-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="px-2 py-1 text-xs">
                <p>Listen to breakdown</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Copy Button */}
      <div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                {copied ? (
                  <Icons.Check className="size-3.5 animate-in zoom-in-50 duration-200" />
                ) : (
                  <Icons.Copy className="size-3 text-muted-foreground hover:text-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>{copied ? "Copied!" : "Copy response"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Retry Button */}
      <div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted"
              >
                <Icons.Refresh className="size-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>Retry response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Positive Feedback Button */}
      <div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handlePositive}
                disabled={
                  createFeedbackMutation.isPending ||
                  deleteFeedbackMutation.isPending
                }
                className={cn(
                  "flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted",
                  (createFeedbackMutation.isPending ||
                    deleteFeedbackMutation.isPending) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                <Icons.ThumbUp
                  className={cn(
                    "w-3 h-3",
                    feedbackGiven === "positive"
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>
                {feedbackGiven === "positive"
                  ? "Remove positive feedback"
                  : "Positive feedback"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Negative Feedback Button */}
      <div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleNegative}
                disabled={
                  createFeedbackMutation.isPending ||
                  deleteFeedbackMutation.isPending
                }
                className={cn(
                  "flex items-center justify-center w-6 h-6 transition-colors duration-200 hover:bg-muted",
                  (createFeedbackMutation.isPending ||
                    deleteFeedbackMutation.isPending) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                <Icons.ThumbDown
                  className={cn(
                    "w-3 h-3",
                    feedbackGiven === "negative"
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent className="px-2 py-1 text-xs">
              <p>
                {feedbackGiven === "negative"
                  ? "Remove negative feedback"
                  : "Negative feedback"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
