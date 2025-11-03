"use client";

import { useChatInterface } from "@/hooks/use-chat-interface";
import { useArtifact } from "@ai-sdk-tools/artifacts/client";
import { useChatActions, useChatId, useChatStatus } from "@ai-sdk-tools/store";
import { followupQuestionsArtifact } from "@api/ai/artifacts/followup-questions";
import { Button } from "@midday/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function FollowupQuestions() {
  const { data } = useArtifact(followupQuestionsArtifact);
  const [isVisible, setIsVisible] = useState(false);
  const { sendMessage } = useChatActions();
  const { setChatId } = useChatInterface();
  const status = useChatStatus();
  const chatId = useChatId();

  const handleQuestionSelect = (question: string) => {
    if (chatId) {
      setChatId(chatId);

      sendMessage({
        role: "user",
        parts: [{ type: "text", text: question }],
      });
    }
  };

  useEffect(() => {
    if (
      status !== "streaming" &&
      data?.questions &&
      data.questions.length > 0
    ) {
      // Small delay to allow for smooth animation
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [data]);

  if (!data?.questions || data.questions.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute bottom-full left-0 right-0 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative">
            <motion.div
              className="flex items-center gap-2 overflow-x-auto justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {data.questions.map((question, index) => (
                <motion.div
                  key={`followup-${question.slice(0, 20)}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.9 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                      },
                    },
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs rounded-full text-[#707070] bg-background/95 backdrop-blur-md border-border hover:bg-accent/50 transition-colors whitespace-nowrap"
                    onClick={() => handleQuestionSelect(question)}
                  >
                    {question}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
            {/* Right fade gradient to indicate more content */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
