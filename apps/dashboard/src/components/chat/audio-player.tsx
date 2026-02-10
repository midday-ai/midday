"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayerStore } from "@/store/audio-player";
import { AudioWaveform } from "./audio-waveform";

function formatTime(seconds: number): string {
  if (Number.isNaN(seconds) || !Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioPlayer() {
  const { isVisible, audioUrl, autoPlay, isLoading, close } =
    useAudioPlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  // Track which audio element the source is bound to (for detecting remounts)
  const sourceElementRef = useRef<HTMLAudioElement | null>(null);
  const prevAudioUrlRef = useRef<string | null>(null);

  // Reset state when audio URL changes
  useEffect(() => {
    if (audioUrl !== prevAudioUrlRef.current) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      prevAudioUrlRef.current = audioUrl;

      // Note: We intentionally do NOT reset sourceRef here.
      // A MediaElementAudioSourceNode is permanently bound to its HTMLMediaElement -
      // you can only call createMediaElementSource() once per audio element.
      // The source remains valid when the audio src attribute changes.
      // We only reset the analyser to allow reconnection if needed.
      analyserRef.current = null;
    }
  }, [audioUrl]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => {
      if (!Number.isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (!Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Hide the audio player when playback finishes
      close();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("loadeddata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Try to get duration if already loaded
    if (audio.readyState >= 1) {
      updateDuration();
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("loadeddata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioUrl, close]);

  // Setup Web Audio API for waveform visualization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const setupAudioContext = async () => {
      try {
        // Reuse or create audio context
        if (
          !audioContextRef.current ||
          audioContextRef.current.state === "closed"
        ) {
          const AudioContextClass =
            window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext: typeof AudioContext;
              }
            ).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
        }

        const audioContext = audioContextRef.current;

        // Create analyser if needed (reset when URL changes)
        if (!analyserRef.current) {
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          analyserRef.current = analyser;
        }

        // Create source only once per audio element (cannot be recreated)
        // A MediaElementAudioSourceNode is permanently bound to its HTMLMediaElement
        // Reset source if the audio element changed (element was remounted)
        if (sourceRef.current && sourceElementRef.current !== audio) {
          sourceRef.current = null;
          sourceElementRef.current = null;
        }

        if (!sourceRef.current) {
          const source = audioContext.createMediaElementSource(audio);
          sourceRef.current = source;
          sourceElementRef.current = audio;
        }

        // Connect/reconnect the audio graph
        // Disconnect first to avoid duplicate connections
        try {
          sourceRef.current.disconnect();
        } catch {
          // Ignore if not connected
        }

        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);
      } catch (error) {
        console.error("Error setting up Web Audio API:", error);
      }
    };

    // Setup on user interaction (required for AudioContext)
    const handleInteraction = () => {
      setupAudioContext();
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    };

    audio.addEventListener("play", handleInteraction);

    return () => {
      audio.removeEventListener("play", handleInteraction);
    };
  }, [audioUrl]);

  // Auto-play when visible and autoPlay is enabled
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || !isVisible || !autoPlay) return;

    // Small delay to ensure audio is ready
    const timer = setTimeout(async () => {
      try {
        await audio.play();
      } catch (error) {
        // Auto-play may be blocked by browser
        console.warn("Auto-play blocked:", error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible, audioUrl, autoPlay]);

  // Cleanup audio context when component unmounts
  useEffect(() => {
    return () => {
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close();
      }
      // Reset source refs on unmount
      sourceRef.current = null;
      sourceElementRef.current = null;
    };
  }, []);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  }, [isPlaying]);

  const handleScrub = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    close();
  }, [close]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full left-0 right-0 mb-2 z-50"
        >
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
              crossOrigin="anonymous"
            >
              <track kind="captions" />
            </audio>
          )}

          <div
            className={cn(
              "px-3 py-2 flex items-center gap-3",
              "border border-[#e6e6e6] dark:border-[#1d1d1d]",
              "bg-[rgba(247,247,247,0.95)] dark:bg-[rgba(19,19,19,0.95)]",
              "backdrop-blur-lg",
            )}
          >
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={togglePlayPause}
              disabled={!audioUrl || isLoading}
              className={cn(
                "flex items-center justify-center w-8 h-8 transition-colors duration-200",
                "hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]",
                (!audioUrl || isLoading) && "opacity-50 cursor-not-allowed",
              )}
              aria-label={
                isLoading ? "Generating audio..." : isPlaying ? "Pause" : "Play"
              }
            >
              {isLoading ? (
                <Spinner size={16} />
              ) : isPlaying ? (
                <Icons.Stop className="w-4 h-4 text-foreground" />
              ) : (
                <Icons.Play className="w-4 h-4 text-foreground" />
              )}
            </button>

            {/* Duration Display */}
            <div className="text-xs whitespace-nowrap text-muted-foreground min-w-[70px]">
              {isLoading
                ? "Generating..."
                : `${formatTime(currentTime)} / ${formatTime(duration)}`}
            </div>

            {/* Waveform with integrated scrubbing */}
            <div className="flex-1 h-8 min-w-0">
              <AudioWaveform
                analyser={analyserRef.current}
                active={isPlaying}
                processing={isLoading}
                barWidth={2}
                barGap={1}
                barRadius={0}
                height={32}
                sensitivity={1.5}
                mode="static"
                currentTime={currentTime}
                duration={duration}
                onScrub={duration > 0 ? handleScrub : undefined}
                showProgress={duration > 0}
              />
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "flex items-center justify-center w-6 h-6 transition-colors duration-200",
                "hover:bg-[rgba(0,0,0,0.05)] dark:hover:bg-[rgba(255,255,255,0.05)]",
              )}
              aria-label="Close audio player"
            >
              <Icons.Close className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
