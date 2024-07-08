"use client";

import { type Message, voiceMessageAction } from "@/actions/ai/chat/voice";
import { embedding } from "@/actions/ai/chat/voice/embedding";
import { getTranscript } from "@/actions/ai/chat/voice/transcript";
import { useTTS } from "@cartesia/cartesia-js/react";
import { cn } from "@midday/ui/cn";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import type { LottieRefCurrentProps } from "lottie-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Lottie = dynamic(() => import("lottie-react"), {
  ssr: false,
});

export function VoiceAssistant({ setUserSpeeking }) {
  const [conversation, setConversation] = useState<Message[]>([]);
  const animationRef = useRef<LottieRefCurrentProps | null>(null);
  const [isThinking, setThinking] = useState(false);

  const tts = useTTS({
    apiKey: process.env.NEXT_PUBLIC_CARTESIA_API_KEY!,
    sampleRate: 44100,
  });

  const onSubmit = async (data: Blob) => {
    setThinking(true);

    const formData = new FormData();

    if (typeof data === "string") {
      formData.append("input", data);
    } else {
      formData.append("input", data, "audio.wav");
    }

    const transcript = await getTranscript(formData);

    const { messages } = await voiceMessageAction([
      ...conversation,
      { role: "user", content: transcript ?? "" },
    ]);

    setConversation(messages);

    const content = messages.at(-1)?.content;

    await tts.buffer({
      model_id: "sonic-english",
      voice: {
        mode: "embedding",
        embedding,
      },
      transcript: content,
    });

    setThinking(false);

    await tts.play();
  };

  const vad = useMicVAD({
    startOnLoad: true,
    onSpeechEnd: (audio) => {
      const wav = utils.encodeWAV(audio);
      const blob = new Blob([wav], { type: "audio/wav" });

      onSubmit(blob);
    },
    workletURL: "/worker/vad.worklet.bundle.min.js",
    modelURL: "/worker/silero_vad.onnx",
    positiveSpeechThreshold: 0.6,
    minSpeechFrames: 4,
    ortConfig(ort) {
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      ort.env.wasm = {
        wasmPaths: {
          "ort-wasm-simd-threaded.wasm": "/worker/ort-wasm-simd-threaded.wasm",
          "ort-wasm-simd.wasm": "/worker/ort-wasm-simd.wasm",
          "ort-wasm.wasm": "/worker/ort-wasm.wasm",
          "ort-wasm-threaded.wasm": "/worker/ort-wasm-threaded.wasm",
        },
        numThreads: isSafari ? 1 : 4,
      };
    },
  });

  useEffect(() => {
    setUserSpeeking(vad.userSpeaking);
  }, [vad]);

  useEffect(() => {
    if (tts.playbackStatus === "playing") {
      animationRef.current?.play();
    } else {
      animationRef.current?.stop();
    }
  }, [tts.playbackStatus]);

  return (
    <div className="absolute left-[180px] top-[150px] flex flex-col">
      <Lottie
        lottieRef={animationRef}
        autoplay={false}
        animationData={require("public/assets/voice-animation.json")}
        loop={true}
        style={{ width: 350 }}
        rendererSettings={{
          preserveAspectRatio: "xMidYMid slice",
        }}
      />

      <span
        className={cn(
          "text-xs animate-pulse text-center text-[#606060] invisible",
          isThinking && "visible"
        )}
      >
        Thinking...
      </span>
    </div>
  );
}
