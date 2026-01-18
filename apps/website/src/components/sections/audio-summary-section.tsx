"use client";

import { Icons } from "@midday/ui/icons";
import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../homepage/icon-mapping";

interface AudioSummarySectionProps {
  audioUrl?: string;
}

export function AudioSummarySection({ audioUrl }: AudioSummarySectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Web Audio API refs for real waveform
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<number[]>([]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const updateTime = () => {
      if (audio.currentTime !== undefined && !Number.isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (
        audio.duration !== undefined &&
        !Number.isNaN(audio.duration) &&
        audio.duration > 0
      ) {
        setDuration(audio.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedData = () => {
      updateDuration();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Try to get duration if already loaded
    if (audio.readyState >= 1) {
      updateDuration();
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("ended", () => setIsPlaying(false));
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [audioUrl]);

  // Setup Web Audio API for real waveform visualization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const setupAudioContext = async () => {
      // Only create once
      if (audioContextRef.current && sourceRef.current) return;

      try {
        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioContext.createMediaElementSource(audio);
        sourceRef.current = source;

        source.connect(analyser);
        analyser.connect(audioContext.destination);
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

  // Real-time waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cache dimensions to avoid forced reflows in animation loop
    let cachedWidth = 0;
    let cachedHeight = 0;
    let cachedBarColor = "";

    const updateCachedValues = () => {
      const rect = canvas.getBoundingClientRect();
      cachedWidth = rect.width;
      cachedHeight = rect.height;

      // Cache computed color (only changes on theme change)
      const style = getComputedStyle(canvas);
      const primaryColor =
        style.getPropertyValue("--primary").trim() || "220 14% 96%";
      cachedBarColor = `hsl(${primaryColor})`;
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      updateCachedValues();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const barWidth = 3;
    const barGap = 1;
    const step = barWidth + barGap;

    // Generate static pattern once for idle state (no random to avoid glitches)
    const generateStaticPattern = (barCount: number): number[] => {
      const pattern: number[] = [];
      const halfCount = Math.floor(barCount / 2);

      for (let i = 0; i < halfCount; i++) {
        const normalizedPos = i / halfCount;
        const wave1 = Math.sin(normalizedPos * Math.PI * 3) * 0.3;
        const wave2 = Math.sin(normalizedPos * Math.PI * 7) * 0.15;
        const wave3 = Math.cos(normalizedPos * Math.PI * 11) * 0.1;
        const value = Math.max(0.15, 0.3 + wave1 + wave2 + wave3);
        pattern.push(value);
      }

      // Mirror the pattern
      const mirroredPattern = [...pattern].reverse();
      return [...mirroredPattern, ...pattern];
    };

    let staticPattern: number[] = [];

    const animate = () => {
      // Use cached dimensions instead of getBoundingClientRect()
      const width = cachedWidth;
      const height = cachedHeight;
      const centerY = height / 2;

      // Calculate bar count based on actual width to fill entire space
      const barCount = Math.floor(width / step);

      // Get real frequency data if playing and analyser is available
      if (isPlaying && analyserRef.current) {
        const analyser = analyserRef.current;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Map frequency data to bar count with mirroring for symmetric display
        const newFrequencyData: number[] = [];
        const halfCount = Math.floor(barCount / 2);

        // Use lower frequencies (more musical content) - skip very low frequencies
        const startFreq = Math.floor(dataArray.length * 0.05);
        const endFreq = Math.floor(dataArray.length * 0.5);
        const relevantData = Array.from(dataArray.slice(startFreq, endFreq));

        for (let i = 0; i < halfCount; i++) {
          const dataIndex = Math.floor((i / halfCount) * relevantData.length);
          const value = Math.max(0.1, (relevantData[dataIndex] || 0) / 255);
          newFrequencyData.push(value);
        }

        // Mirror for symmetric display
        const mirroredData = [...newFrequencyData].reverse();
        frequencyDataRef.current = [...mirroredData, ...newFrequencyData];
      }

      // Generate static pattern if not playing and pattern doesn't match bar count
      if (!isPlaying && staticPattern.length !== barCount) {
        staticPattern = generateStaticPattern(barCount);
      }

      ctx.clearRect(0, 0, width, height);

      // Use cached color instead of getComputedStyle()
      const barColor = cachedBarColor;

      // Calculate progress for visual indication
      const progress = duration > 0 ? currentTime / duration : 0;
      const progressIndex = Math.floor(progress * barCount);

      for (let i = 0; i < barCount; i++) {
        const x = i * step;

        let barHeight: number;
        if (isPlaying && frequencyDataRef.current.length > 0) {
          // Use real frequency data when playing
          const value = frequencyDataRef.current[i] || 0.1;
          barHeight = Math.max(2, value * height * 0.85);
        } else {
          // Use pre-generated static pattern (no random = no glitches)
          const value = staticPattern[i] || 0.15;
          barHeight = Math.max(2, value * height * 0.8);
        }

        const y = centerY - barHeight / 2;
        ctx.fillStyle = barColor;

        // Different opacity for played vs unplayed portion
        const isPlayed = i <= progressIndex;
        ctx.globalAlpha = isPlayed
          ? isPlaying
            ? 0.6 + (barHeight / height) * 0.4
            : 0.4 + (barHeight / height) * 0.3
          : isPlaying
            ? 0.3 + (barHeight / height) * 0.2
            : 0.2 + (barHeight / height) * 0.15;

        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  const togglePlay = async () => {
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
  };

  const formatTime = (seconds: number) => {
    if (Number.isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * duration;
  };

  return (
    <section className="bg-background py-12 sm:py-16 lg:py-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-serif text-2xl sm:text-2xl text-foreground">
            Understand your week, hands-free
          </h2>
          <p className="font-sans text-base text-muted-foreground leading-normal max-w-2xl mx-auto">
            Your weekly summary is also available as a short audio overview you
            can listen to instead of reading.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col border border-border bg-secondary">
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                preload="none"
                crossOrigin="anonymous"
              >
                <track kind="captions" />
              </audio>
            )}

            {/* Audio Player Bar */}
            <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border">
              {/* Play Button */}
              <button
                type="button"
                onClick={togglePlay}
                className="w-5 h-5 flex items-center justify-center transition-colors text-foreground hover:text-muted-foreground"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <MaterialIcon
                  name={isPlaying ? "pause" : "play_arrow"}
                  className="text-foreground"
                  size={20}
                />
              </button>

              {/* Time Display */}
              <span className="font-sans text-xs text-muted-foreground min-w-[40px]">
                {formatTime(currentTime)}/{formatTime(duration)}
              </span>

              {/* Waveform Canvas */}
              <div className="flex-1 h-8 cursor-pointer" onClick={handleSeek}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>

              {/* Close Button */}
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <MaterialIcon name="close" className="text-current" size={16} />
              </button>
            </div>

            {/* Assistant Input Bar */}
            <div className="flex flex-col mt-0.5">
              {/* Input Field */}
              <div className="flex items-center px-3 py-2.5">
                <input
                  type="text"
                  placeholder="Ask anything"
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  readOnly
                />
              </div>

              {/* Icons Row */}
              <div className="flex items-end justify-between px-3 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Add attachment"
                  >
                    <Icons.Add size={16} />
                  </button>
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Quick actions"
                  >
                    <Icons.Bolt size={16} />
                  </button>
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Web search"
                  >
                    <Icons.Globle size={16} />
                  </button>
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="History"
                  >
                    <Icons.History size={16} />
                  </button>
                </div>
                <div className="flex items-end gap-3">
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Voice input"
                  >
                    <Icons.Record size={16} />
                  </button>
                  <button
                    type="button"
                    className="w-6 h-6 flex items-center justify-center transition-opacity bg-foreground hover:opacity-90"
                    aria-label="Send message"
                  >
                    <Icons.ArrowUpward size={18} className="text-background" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
