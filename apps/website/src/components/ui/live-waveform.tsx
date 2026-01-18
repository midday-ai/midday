"use client";

import { cn } from "@midday/ui/cn";
import { type HTMLAttributes, useEffect, useRef } from "react";

export type LiveWaveformProps = HTMLAttributes<HTMLDivElement> & {
  active?: boolean;
  audioElement?: HTMLAudioElement | null;
  barWidth?: number;
  barHeight?: number;
  barGap?: number;
  barRadius?: number;
  barColor?: string;
  fadeEdges?: boolean;
  fadeWidth?: number;
  height?: string | number;
  sensitivity?: number;
  smoothingTimeConstant?: number;
  fftSize?: number;
  updateRate?: number;
  mode?: "scrolling" | "static";
  onAudioContextReady?: (context: AudioContext) => void;
};

export const LiveWaveform = ({
  active = false,
  audioElement,
  barWidth = 3,
  barGap = 1,
  barRadius = 0,
  barColor,
  fadeEdges = true,
  fadeWidth = 24,
  barHeight: baseBarHeight = 4,
  height = 64,
  sensitivity = 1,
  smoothingTimeConstant = 0.8,
  fftSize = 256,
  updateRate = 30,
  mode = "static",
  onAudioContextReady,
  className,
  ...props
}: LiveWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const staticBarsRef = useRef<number[]>([]);
  const needsRedrawRef = useRef(true);
  const gradientCacheRef = useRef<CanvasGradient | null>(null);
  const lastWidthRef = useRef(0);
  const colorCacheRef = useRef<string | null>(null);
  const lastBarColorRef = useRef<string | undefined>(undefined);
  const cachedRectRef = useRef({ width: 0, height: 0 });

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  // Clear color cache when barColor changes
  useEffect(() => {
    if (lastBarColorRef.current !== barColor) {
      colorCacheRef.current = null;
      lastBarColorRef.current = barColor;
    }
  }, [barColor]);

  // Handle canvas resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      // Cache rect dimensions to avoid forced reflows in animation loop
      cachedRectRef.current = { width: rect.width, height: rect.height };
      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
      needsRedrawRef.current = true;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Setup audio context for audio element (set up even when not active so it's ready)
  useEffect(() => {
    if (!audioElement) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
      return;
    }

    const setupAudioContext = async () => {
      try {
        // Reuse existing audio context if available
        let audioContext = audioContextRef.current;
        if (!audioContext || audioContext.state === "closed") {
          const AudioContextConstructor =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext;
          audioContext = new AudioContextConstructor();
          audioContextRef.current = audioContext;
        }

        // Resume context if suspended (required for user interaction)
        if (audioContext.state === "suspended") {
          try {
            await audioContext.resume();
          } catch (error) {
            console.error("Error resuming audio context:", error);
          }
        }

        // Only create source if it doesn't exist for this audio element
        const isNewAudioElement = audioElementRef.current !== audioElement;

        if (isNewAudioElement) {
          // Reset refs when audio element changes
          sourceRef.current = null;
          analyserRef.current = null;
          audioElementRef.current = audioElement;
        }

        // Only create source if it doesn't exist
        if (!sourceRef.current) {
          try {
            const source = audioContext.createMediaElementSource(audioElement);
            sourceRef.current = source;

            // Create analyser
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = fftSize;
            analyser.smoothingTimeConstant = smoothingTimeConstant;
            analyserRef.current = analyser;

            // Connect source to analyser, and analyser to destination
            // IMPORTANT: When you create a MediaElementSource, it disconnects the audio element
            // from its default output. Audio will ONLY play through the audio context destination.
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            // Ensure audio context is running
            if (audioContext.state === "suspended") {
              audioContext.resume().catch(console.error);
            }

            // Notify parent that audio context is ready
            console.log(
              "LiveWaveform: Notifying parent of audio context, state:",
              audioContext.state,
            );
            onAudioContextReady?.(audioContext);

            // Ensure context is running before notifying again
            if (audioContext.state === "suspended") {
              audioContext
                .resume()
                .then(() => {
                  console.log(
                    "LiveWaveform: Audio context resumed, notifying parent again",
                  );
                  onAudioContextReady?.(audioContext);
                })
                .catch(console.error);
            }
          } catch (error) {
            // If source already exists, handle gracefully
            if (
              error instanceof Error &&
              error.message.includes("already connected")
            ) {
              // Audio element already has a source, just create analyser if needed
              if (!analyserRef.current) {
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = fftSize;
                analyser.smoothingTimeConstant = smoothingTimeConstant;
                analyserRef.current = analyser;
                analyser.connect(audioContext.destination);
              }
            } else {
              console.error("Error setting up audio context:", error);
            }
          }
        } else if (analyserRef.current) {
          // Source and analyser exist, ensure analyser is connected
          if (analyserRef.current.numberOfInputs === 0) {
            analyserRef.current.connect(audioContext.destination);
          }
          // Notify parent that audio context is ready (even if already set up)
          onAudioContextReady?.(audioContext);
        } else {
          // No source or analyser, but context exists - notify anyway
          onAudioContextReady?.(audioContext);
        }

        // Always notify that context is ready (even if source setup failed)
        onAudioContextReady?.(audioContext);
      } catch (error) {
        console.error("Error setting up audio context:", error);
        // Even if there's an error, notify if we have a context
        if (audioContextRef.current) {
          onAudioContextReady?.(audioContextRef.current);
        }
      }
    };

    // Setup audio context - try immediately, and also wait for audio to be ready
    // Try immediately first
    setupAudioContext().then(() => {
      // Ensure callback is called after setup
      if (audioContextRef.current && onAudioContextReady) {
        onAudioContextReady(audioContextRef.current);
      }
    });

    // Also set up listeners in case audio isn't ready yet
    const onCanPlay = () => {
      setupAudioContext();
    };
    const onLoadedMetadata = () => {
      setupAudioContext();
    };
    audioElement.addEventListener("canplay", onCanPlay);
    audioElement.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audioElement.removeEventListener("canplay", onCanPlay);
      audioElement.removeEventListener("loadedmetadata", onLoadedMetadata);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [audioElement, fftSize, smoothingTimeConstant]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const animate = (currentTime: number) => {
      // Use cached rect to avoid forced reflows
      const rect = cachedRectRef.current;

      // Update audio data if active
      if (
        active &&
        analyserRef.current &&
        currentTime - lastUpdateRef.current > updateRate
      ) {
        lastUpdateRef.current = currentTime;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        if (mode === "static") {
          // For static mode, update bars in place
          const startFreq = Math.floor(dataArray.length * 0.05);
          const endFreq = Math.floor(dataArray.length * 0.4);
          const relevantData = dataArray.slice(startFreq, endFreq);

          const barCount = Math.floor(rect.width / (barWidth + barGap));
          const halfCount = Math.floor(barCount / 2);
          const newBars: number[] = [];

          // Mirror the data for symmetric display
          for (let i = halfCount - 1; i >= 0; i--) {
            const dataIndex = Math.floor((i / halfCount) * relevantData.length);
            const value = Math.min(
              1,
              (relevantData[dataIndex] / 255) * sensitivity,
            );
            newBars.push(Math.max(0.05, value));
          }

          for (let i = 0; i < halfCount; i++) {
            const dataIndex = Math.floor((i / halfCount) * relevantData.length);
            const value = Math.min(
              1,
              (relevantData[dataIndex] / 255) * sensitivity,
            );
            newBars.push(Math.max(0.05, value));
          }

          staticBarsRef.current = newBars;
          needsRedrawRef.current = true;
        }
      }

      // Always redraw when active, or when needsRedraw is true
      if (!active && !needsRedrawRef.current) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      // Reset needsRedraw flag after checking
      if (needsRedrawRef.current) {
        needsRedrawRef.current = false;
      }
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Get color from CSS variable or use provided color (cached)
      const getComputedColor = () => {
        // Use cached color if available
        if (colorCacheRef.current) return colorCacheRef.current;

        const container = containerRef.current;
        if (!container) return "#000000";

        // Resolve the color by creating a test element with the same color as the dotted line
        const tempEl = document.createElement("div");
        tempEl.style.position = "absolute";
        tempEl.style.visibility = "hidden";
        tempEl.style.color = barColor || "hsl(var(--primary))";
        container.appendChild(tempEl);

        const computedColor = getComputedStyle(tempEl).color;
        container.removeChild(tempEl);

        if (
          computedColor &&
          computedColor !== "rgba(0, 0, 0, 0)" &&
          computedColor !== "transparent"
        ) {
          colorCacheRef.current = computedColor;
          return computedColor;
        }

        // Fallback: try getting from root
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryValue = rootStyle.getPropertyValue("--primary").trim();
        if (primaryValue) {
          const fallbackColor = `hsl(${primaryValue})`;
          colorCacheRef.current = fallbackColor;
          return fallbackColor;
        }

        return "#000000";
      };
      const computedBarColor = getComputedColor();

      const step = barWidth + barGap;
      const barCount = Math.floor(rect.width / step);
      const centerY = rect.height / 2;

      // Draw bars in static mode
      if (mode === "static") {
        const dataToRender = active ? staticBarsRef.current : [];

        for (let i = 0; i < barCount && i < dataToRender.length; i++) {
          const value = dataToRender[i] || 0.1;
          const x = i * step;
          const barHeight = Math.max(baseBarHeight, value * rect.height * 0.8);
          const y = centerY - barHeight / 2;

          ctx.fillStyle =
            active && value > 0.1
              ? computedBarColor
              : "hsl(var(--muted-foreground) / 0.3)";
          ctx.globalAlpha = active ? 0.4 + value * 0.6 : 0.3;

          if (barRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // Draw idle bars when not active - voice-like pattern
        if (!active && dataToRender.length === 0) {
          // Generate a voice-like waveform pattern
          const voicePattern: number[] = [];
          const halfCount = Math.floor(barCount / 2);

          // Create a symmetric voice-like pattern with varying heights
          for (let i = 0; i < halfCount; i++) {
            const normalizedPos = i / halfCount;
            // Create wave-like patterns that mimic voice
            const wave1 = Math.sin(normalizedPos * Math.PI * 3) * 0.3;
            const wave2 = Math.sin(normalizedPos * Math.PI * 7) * 0.15;
            const wave3 = Math.cos(normalizedPos * Math.PI * 11) * 0.1;
            // Add some randomness for natural variation
            const random = (Math.random() - 0.5) * 0.2;
            // Combine waves and ensure minimum height
            const value = Math.max(0.15, 0.3 + wave1 + wave2 + wave3 + random);
            voicePattern.push(value);
          }

          // Mirror the pattern for symmetry
          const mirroredPattern = [...voicePattern].reverse();
          const fullPattern = [...mirroredPattern, ...voicePattern];

          for (let i = 0; i < barCount && i < fullPattern.length; i++) {
            const value = fullPattern[i] || 0.15;
            const x = i * step;
            const barHeight = Math.max(
              baseBarHeight,
              value * rect.height * 0.6,
            );
            const y = centerY - barHeight / 2;

            ctx.fillStyle = computedBarColor;
            ctx.globalAlpha = 0.3 + value * 0.3;
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }

      // Apply edge fading
      if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
        if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
          const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
          const fadePercent = Math.min(0.3, fadeWidth / rect.width);

          gradient.addColorStop(0, "rgba(255,255,255,1)");
          gradient.addColorStop(fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1 - fadePercent, "rgba(255,255,255,0)");
          gradient.addColorStop(1, "rgba(255,255,255,1)");

          gradientCacheRef.current = gradient;
          lastWidthRef.current = rect.width;
        }

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = gradientCacheRef.current;
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    active,
    sensitivity,
    updateRate,
    barWidth,
    baseBarHeight,
    barGap,
    barRadius,
    barColor,
    fadeEdges,
    fadeWidth,
    mode,
  ]);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={active ? "Live audio waveform" : "Audio waveform idle"}
      role="img"
      {...props}
    >
      {!active && (
        <div className="border-primary/20 absolute top-1/2 right-0 left-0 -translate-y-1/2 border-t-2 border-dotted" />
      )}
      <canvas className="block h-full w-full" ref={canvasRef} />
    </div>
  );
};
