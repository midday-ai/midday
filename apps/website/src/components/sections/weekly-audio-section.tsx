"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../homepage/icon-mapping";

interface WeeklyAudioSectionProps {
  audioUrl?: string;
}

export function WeeklyAudioSection({ audioUrl }: WeeklyAudioSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

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

  // Simple animated waveform - no Web Audio API needed
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let time = 0;
    const barWidth = 3;
    const barGap = 1;
    const step = barWidth + barGap;

    // Animation speed control - lower = slower
    const animationSpeed = 0.004;

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
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      // Calculate bar count based on actual width to fill entire space
      const barCount = Math.floor(width / step);

      // Generate static pattern if not playing and pattern doesn't match bar count
      if (!isPlaying && staticPattern.length !== barCount) {
        staticPattern = generateStaticPattern(barCount);
      }

      ctx.clearRect(0, 0, width, height);

      // Get color
      const style = getComputedStyle(canvas);
      const primaryColor =
        style.getPropertyValue("--primary").trim() || "220 14% 96%";
      const barColor = `hsl(${primaryColor})`;

      for (let i = 0; i < barCount; i++) {
        const x = i * step;
        const normalizedPos = (i - barCount / 2) / (barCount / 2);

        let barHeight: number;
        if (isPlaying) {
          // Animated waveform when playing
          time += animationSpeed;
          const wave1 = Math.sin(time * 0.5 + normalizedPos * 3) * 0.3;
          const wave2 = Math.sin(time * 0.35 - normalizedPos * 2) * 0.2;
          const wave3 = Math.cos(time * 0.7 + normalizedPos) * 0.15;
          const combinedWave = wave1 + wave2 + wave3;
          const value = Math.max(0.15, 0.3 + combinedWave);
          barHeight = Math.max(4, value * height * 0.6);
        } else {
          // Use pre-generated static pattern (no random = no glitches)
          const value = staticPattern[i] || 0.15;
          barHeight = Math.max(4, value * height * 0.6);
        }

        const y = centerY - barHeight / 2;
        ctx.fillStyle = barColor;
        ctx.globalAlpha = isPlaying
          ? 0.4 + (barHeight / height) * 0.6
          : 0.3 + (barHeight / height) * 0.3;
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
  }, [isPlaying]);

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
            A quick audio overview of how your business performed last week,
            designed for busy moments.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-secondary border border-border p-4 relative">
            <audio ref={audioRef} src={audioUrl} preload="metadata">
              <track kind="captions" />
            </audio>

            {/* Waveform Canvas */}
            <div
              className="mb-4 h-[64px] w-full cursor-pointer"
              onClick={handleSeek}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ imageRendering: "crisp-edges" }}
              />
            </div>

            {/* Play Controls */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:border-muted-foreground transition-colors"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                <MaterialIcon
                  name={isPlaying ? "pause" : "play_arrow"}
                  className="text-foreground"
                  size={20}
                />
              </button>

              <div className="flex-1 flex items-center gap-3">
                <span className="font-sans text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(currentTime)}
                </span>

                {/* Progress Bar */}
                <div className="flex-1 h-1 bg-muted relative overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width:
                        duration && !Number.isNaN(duration) && duration > 0
                          ? `${Math.min((currentTime / duration) * 100, 100)}%`
                          : "0%",
                      backgroundColor: "hsl(var(--primary))",
                      minWidth:
                        duration &&
                        !Number.isNaN(duration) &&
                        duration > 0 &&
                        currentTime > 0
                          ? "2px"
                          : "0px",
                    }}
                  />
                </div>

                <span className="font-sans text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

