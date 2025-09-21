"use client";

import { FollowupQuestions } from "@/components/chat/followup-questions";
import { useAudioRecording } from "@/hooks/use-audio-recording";
import { useChatInterface } from "@/hooks/use-chat-interface";
import { useArtifacts } from "@ai-sdk-tools/artifacts/client";
import { useChatActions, useChatId, useChatStatus } from "@ai-sdk-tools/store";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@midday/ui/prompt-input";
import { RecordButton } from "@midday/ui/record-button";
import { useCallback, useState } from "react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [webSearch, setWebSearch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { sendMessage } = useChatActions();
  const status = useChatStatus();
  const chatId = useChatId();
  const { setChatId } = useChatInterface();
  const { current } = useArtifacts({
    exclude: ["chat-title", "followup-questions"],
  });
  const isCanvasVisible = !!current;

  const {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    transcribeAudio,
  } = useAudioRecording();

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (!chatId) {
      return;
    }

    // Set chatId as query parameter using nuqs
    setChatId(chatId);

    let processedFiles = message.files;

    // Convert blob URLs to data URLs for server compatibility
    if (message.files && message.files.length > 0) {
      setIsUploading(true);
      try {
        processedFiles = await Promise.all(
          message.files.map(async (file) => {
            // If it's a blob URL, convert to data URL
            if (file.url.startsWith("blob:")) {
              const response = await fetch(file.url);
              const blob = await response.blob();

              // Convert blob to data URL
              const dataUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });

              return {
                ...file,
                url: dataUrl,
              };
            }

            // Return file as-is if not a blob URL
            return file;
          }),
        );
      } catch (error) {
        console.error("Failed to process files:", error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(
      {
        text: message.text || "Sent with attachments",
        files: processedFiles,
      },
      // {
      //   webSearch,
      // },
    );

    setInput("");
  };

  const handleRecordClick = useCallback(async () => {
    if (isRecording) {
      // Stop recording and transcribe
      try {
        const audioBlob = await stopRecording();

        if (audioBlob) {
          const transcribedText = await transcribeAudio(audioBlob);

          if (transcribedText.trim()) {
            setInput((prev) =>
              prev ? `${prev} ${transcribedText}` : transcribedText,
            );
          }
        }
      } catch (error) {
        console.error("Failed to process recording:", error);
      }
    } else {
      // Start recording and reset input
      try {
        setInput(""); // Reset input when starting to record
        await startRecording();
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  }, [isRecording, stopRecording, startRecording, transcribeAudio]);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-[70px] z-20 px-6 transition-all duration-300 ease-in-out",
        isCanvasVisible ? "right-[603px]" : "right-0",
      )}
    >
      <div className="mx-auto w-full pt-2 max-w-[770px] relative">
        <FollowupQuestions />

        <PromptInput onSubmit={handleSubmit} globalDrop multiple>
          <PromptInputBody>
            <PromptInputAttachments>
              {(attachment) => <PromptInputAttachment data={attachment} />}
            </PromptInputAttachments>
            <PromptInputTextarea
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              value={input}
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputActionAddAttachments />
              <PromptInputButton
                onClick={() => setWebSearch(!webSearch)}
                className={cn("size-6", webSearch && "text-primary")}
              >
                <Icons.Globle size={16} />
              </PromptInputButton>
            </PromptInputTools>

            <PromptInputTools>
              <RecordButton
                isRecording={isRecording}
                isProcessing={isProcessing}
                onClick={handleRecordClick}
                size={16}
              />
              <PromptInputSubmit
                disabled={
                  (!input && !status) ||
                  isUploading ||
                  isRecording ||
                  isProcessing
                }
                status={status}
              />
            </PromptInputTools>
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
