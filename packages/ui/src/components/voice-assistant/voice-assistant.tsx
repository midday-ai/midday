"use client";

import { EnterIcon } from "@radix-ui/react-icons";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { track } from "@vercel/analytics";
import clsx from "clsx";
import { LoaderPinwheel } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePlayer } from "../../lib/players/use-player";

import { cn } from "../../utils/cn";
import { Button } from "../button";

import AssistantButton from "../button/assistant-button";

type Message = {
  role: "user" | "assistant";
  content: string;
  latency?: number;
};

export interface VoiceAssistantFormProps {
  className?: string;
  mode: "voice" | "text";
}

export const VoiceAssistantForm: React.FC<VoiceAssistantFormProps> = ({
  className,
  mode,
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<Message>>([]);
  const [isPending, setIsPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const player = usePlayer();

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
      player.stop();
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: "audio/wav" });
      submit(blob);
      const isFirefox = navigator.userAgent.includes("Firefox");
      console.log("isFirefox", isFirefox);
      if (isFirefox) vad.pause();
    },
    workletURL: "/vad.worklet.bundle.min.js",
    modelURL: "/silero_vad.onnx",
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
    ortConfig(ort) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );

      ort.env.wasm = {
        wasmPaths: {
          "ort-wasm-simd-threaded.wasm": "/ort-wasm-simd-threaded.wasm",
          "ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
          "ort-wasm.wasm": "/ort-wasm.wasm",
          "ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm",
        },
        numThreads: isSafari ? 1 : 4,
      };
    },
  });

  useEffect(() => {
    function keyDown(e: KeyboardEvent) {
      if (e.key === "Enter") return inputRef.current?.focus();
      if (e.key === "Escape") return setInput("");
    }

    window.addEventListener("keydown", keyDown);
    return () => window.removeEventListener("keydown", keyDown);
  }, []);

  const submit = useCallback(
    async (data: string | Blob) => {
      setIsPending(true);
      const formData = new FormData();

      if (typeof data === "string") {
        formData.append("input", data);
        track("Text input");
      } else {
        formData.append("input", data, "audio.wav");
        track("Speech input");
      }

      for (const message of messages) {
        formData.append("message", JSON.stringify(message));
      }

      const submittedAt = Date.now();

      try {
        const response = await fetch("/api", {
          method: "POST",
          body: formData,
        });

        const transcript = decodeURIComponent(
          response.headers.get("X-Transcript") || "",
        );
        const text = decodeURIComponent(
          response.headers.get("X-Response") || "",
        );

        if (!response.ok || !transcript || !text || !response.body) {
          if (response.status === 429) {
            toast.error("Too many requests. Please try again later.");
          } else {
            toast.error((await response.text()) || "An error occurred.");
          }
          return;
        }

        const latency = Date.now() - submittedAt;
        player.play(response.body, () => {
          const isFirefox = navigator.userAgent.includes("Firefox");
          if (isFirefox) vad.start();
        });
        setInput(transcript);

        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "user", content: transcript },
          { role: "assistant", content: text, latency },
        ]);
      } catch (error) {
        console.error(error);
        toast.error("An error occurred.");
      } finally {
        setIsPending(false);
      }
    },
    [messages, player, vad],
  );

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(input);
  }

  return (
    <>
      {mode === "voice" && <AssistantButton />}
      <div className={cn(mode === "voice" ? "hidden" : "")}>
        <div className="min-h-28 pb-4" />
        {/** hide the below form if voice mode is enabled */}
        <form
          className={cn(
            "flex w-full max-w-3xl items-center rounded-full border border-transparent bg-neutral-200/80 focus-within:border-neutral-400 hover:border-neutral-300 hover:focus-within:border-neutral-400 dark:bg-neutral-800/80 dark:focus-within:border-neutral-600 dark:hover:border-neutral-700 dark:hover:focus-within:border-neutral-600",
          )}
          onSubmit={handleFormSubmit}
        >
          <input
            type="text"
            className={cn(
              "w-full bg-transparent p-4 placeholder:text-neutral-600 focus:outline-none dark:placeholder:text-neutral-400",
            )}
            required
            placeholder="Ask me anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            ref={inputRef}
          />

          <Button
            type="submit"
            className="p-4 text-neutral-700 hover:text-background dark:text-neutral-300 dark:hover:text-foreground"
            disabled={isPending}
            aria-label="Submit"
            variant={"ghost"}
          >
            {isPending ? <LoaderPinwheel /> : <EnterIcon />}
          </Button>
        </form>

        <div className="min-h-28 max-w-xl space-y-4 text-balance pt-4 text-center text-neutral-400 dark:text-neutral-600">
          {messages.length > 0 && (
            <p>
              {messages[messages.length - 1]?.content}
              <span className="font-mono text-xs text-neutral-300 dark:text-neutral-700">
                {" "}
                ({messages[messages.length - 1]?.latency}ms)
              </span>
            </p>
          )}

          {messages.length === 0 && (
            <>
              <p>{mode === "voice" ? "Start speaking" : "Start typing"}</p>

              {vad.loading ? (
                <p>Loading speech detection...</p>
              ) : vad.errored ? (
                <p>Failed to load speech detection.</p>
              ) : (
                <p>Start talking to chat.</p>
              )}
            </>
          )}
        </div>

        <div
          className={clsx(
            "absolute -z-50 size-36 rounded-full bg-gradient-to-b from-red-200 to-red-400 blur-3xl transition ease-in-out dark:from-red-600 dark:to-red-800",
            {
              "opacity-0": vad.loading || vad.errored,
              "opacity-30": !vad.loading && !vad.errored && !vad.userSpeaking,
              "scale-110 opacity-100": vad.userSpeaking,
            },
          )}
        />
      </div>
    </>
  );
};

interface AProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

function A(props: AProps) {
  return (
    <a
      {...props}
      className="font-medium text-neutral-500 hover:underline dark:text-neutral-500"
    />
  );
}

export default VoiceAssistantForm;
