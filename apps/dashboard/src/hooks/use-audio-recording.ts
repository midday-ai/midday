"use client";

import { createClient } from "@midday/supabase/client";
import { useCallback, useRef, useState } from "react";

interface UseAudioRecordingReturn {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  transcribeAudio: (audioBlob: Blob) => Promise<string>;
}

export function useAudioRecording(): UseAudioRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hard limit: 1 minute (60 seconds)
  const MAX_RECORDING_TIME = 60 * 1000; // 60 seconds in milliseconds

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      // Clear the recording timer if it exists
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Stop all audio tracks
        if (streamRef.current) {
          for (const track of streamRef.current.getTracks()) {
            track.stop();
          }
        }
        streamRef.current = null;

        // Create audio blob from chunks
        const audioBlob =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, {
                type: "audio/webm;codecs=opus",
              })
            : null;

        // Clear chunks
        audioChunksRef.current = [];
        setIsRecording(false);
        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Set up auto-stop timer for 1 minute limit
      recordingTimerRef.current = setTimeout(() => {
        console.log("Recording automatically stopped after 1 minute");
        stopRecording();
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error("Error starting audio recording:", error);
      throw error;
    }
  }, [stopRecording]);

  const transcribeAudio = useCallback(
    async (audioBlob: Blob): Promise<string> => {
      setIsProcessing(true);

      try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        // Get authenticated session
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/transcription`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              audio: base64Audio,
              mimeType: audioBlob.type,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Transcription API error:", {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(
            `Failed to transcribe audio: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Transcription failed");
        }

        return data.text;
      } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    transcribeAudio,
  };
}
