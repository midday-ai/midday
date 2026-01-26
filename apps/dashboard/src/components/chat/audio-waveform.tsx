"use client";

import { cn } from "@midday/ui/cn";
import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type AudioWaveformProps = HTMLAttributes<HTMLDivElement> & {
  /** AnalyserNode for real-time frequency data */
  analyser?: AnalyserNode | null;
  /** Whether the audio is currently playing */
  active?: boolean;
  /** Whether audio is being generated/loaded */
  processing?: boolean;
  /** Width of each bar in pixels */
  barWidth?: number;
  /** Gap between bars in pixels */
  barGap?: number;
  /** Border radius of bars */
  barRadius?: number;
  /** Color of the bars */
  barColor?: string;
  /** Height of the waveform container */
  height?: number;
  /** Sensitivity multiplier for frequency data */
  sensitivity?: number;
  /** Display mode: 'static' for centered bars, 'scrolling' for moving waveform */
  mode?: "static" | "scrolling";
  /** Current playback time in seconds */
  currentTime?: number;
  /** Total duration in seconds */
  duration?: number;
  /** Callback when user scrubs to a new position */
  onScrub?: (time: number) => void;
  /** Whether to show progress indicator */
  showProgress?: boolean;
  /** Color for the progress indicator (played portion) */
  progressColor?: string;
};

export function AudioWaveform({
  analyser,
  active = false,
  processing = false,
  barWidth = 2,
  barGap = 1,
  barRadius = 0,
  barColor,
  height = 32,
  sensitivity = 1.5,
  mode = "static",
  currentTime = 0,
  duration = 0,
  onScrub,
  showProgress = false,
  progressColor,
  className,
  ...props
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const staticBarsRef = useRef<number[]>([]);
  const frequencyDataRef = useRef<number[]>([]);
  const smoothedBarsRef = useRef<number[]>([]); // For smooth interpolation
  const cachedRectRef = useRef({ width: 0, height: 0 });
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Smoothing factor for bar height interpolation (0-1, lower = smoother)
  const SMOOTHING_FACTOR = 0.15;

  // Generate static pattern for idle state
  const generateStaticPattern = useCallback((barCount: number): number[] => {
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

    // Mirror the pattern for symmetry
    const mirroredPattern = [...pattern].reverse();
    return [...mirroredPattern, ...pattern];
  }, []);

  // Handle scrubbing
  const handleScrub = useCallback(
    (clientX: number) => {
      if (!containerRef.current || !onScrub || duration <= 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(1, x / rect.width));
      onScrub(percent * duration);
    },
    [onScrub, duration],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onScrub || duration <= 0) return;
      isDraggingRef.current = true;
      setIsDragging(true);
      handleScrub(e.clientX);
    },
    [handleScrub, onScrub, duration],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleScrub(e.clientX);
    },
    [handleScrub],
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

      cachedRectRef.current = { width: rect.width, height: rect.height };
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const step = barWidth + barGap;

    const animate = () => {
      const { width, height: canvasHeight } = cachedRectRef.current;
      const centerY = canvasHeight / 2;
      const barCount = Math.floor(width / step);

      // Get real frequency data if active and analyser is available
      if (active && analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        const newFrequencyData: number[] = [];
        const halfCount = Math.floor(barCount / 2);

        // Use lower frequencies (more musical content)
        const startFreq = Math.floor(dataArray.length * 0.05);
        const endFreq = Math.floor(dataArray.length * 0.5);
        const relevantData = Array.from(dataArray.slice(startFreq, endFreq));

        for (let i = 0; i < halfCount; i++) {
          const dataIndex = Math.floor((i / halfCount) * relevantData.length);
          const value = Math.max(
            0.1,
            ((relevantData[dataIndex] || 0) / 255) * sensitivity,
          );
          newFrequencyData.push(value);
        }

        // Mirror for symmetric display
        const mirroredData = [...newFrequencyData].reverse();
        frequencyDataRef.current = [...mirroredData, ...newFrequencyData];
      }

      // Generate static pattern if needed
      if ((!active || !analyser) && staticBarsRef.current.length !== barCount) {
        staticBarsRef.current = generateStaticPattern(barCount);
      }

      ctx.clearRect(0, 0, width, canvasHeight);

      // Resolve bar color (use primary color for better dark mode support)
      // CSS variables are HSL values without hsl() wrapper, so we need to add it
      const primaryValue = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      const computedBarColor =
        barColor || (primaryValue ? `hsl(${primaryValue})` : "#000");

      // Calculate smooth progress (0-1)
      const progress = duration > 0 ? currentTime / duration : 0;

      // Initialize smoothed bars if needed
      if (smoothedBarsRef.current.length !== barCount) {
        smoothedBarsRef.current = new Array(barCount).fill(0.3);
      }

      for (let i = 0; i < barCount; i++) {
        const x = i * step;

        let targetH: number;
        if (active && frequencyDataRef.current.length > 0) {
          // Use real frequency data when playing
          const value = frequencyDataRef.current[i] || 0.1;
          targetH = Math.max(2, value * canvasHeight * 0.85);
        } else if (processing) {
          // Smooth wave animation when processing (no random noise)
          const time = Date.now() / 1000;
          // Multiple overlapping sine waves for organic movement
          const wave1 = Math.sin(time * 2 + i * 0.15) * 0.25;
          const wave2 = Math.sin(time * 3.7 + i * 0.08) * 0.15;
          const wave3 = Math.sin(time * 1.3 - i * 0.12) * 0.1;
          const pulse = 0.35 + wave1 + wave2 + wave3;
          targetH = Math.max(2, pulse * canvasHeight * 0.7);
        } else {
          // Use static pattern
          const value = staticBarsRef.current[i] || 0.15;
          targetH = Math.max(2, value * canvasHeight * 0.8);
        }

        // Smooth interpolation for bar heights
        const currentH = smoothedBarsRef.current[i] || targetH;
        const smoothedH = currentH + (targetH - currentH) * SMOOTHING_FACTOR;
        smoothedBarsRef.current[i] = smoothedH;

        const barH = smoothedH;
        const y = centerY - barH / 2;

        // Smooth progress calculation (not snapping to bar boundaries)
        const barProgress = i / barCount;
        const isPlayed = showProgress && barProgress <= progress;
        // Partial fill for the bar at the progress boundary
        const isPartial =
          showProgress &&
          barProgress <= progress &&
          (i + 1) / barCount > progress;

        ctx.fillStyle = isPlayed
          ? progressColor || computedBarColor
          : computedBarColor;

        if (active) {
          ctx.globalAlpha = isPlayed ? 0.9 : 0.4 + (barH / canvasHeight) * 0.3;
        } else if (processing) {
          ctx.globalAlpha = 0.5 + (barH / canvasHeight) * 0.3;
        } else {
          // Smooth opacity transition at progress boundary
          if (isPartial) {
            const partialProgress = progress * barCount - i;
            ctx.globalAlpha =
              0.25 + partialProgress * 0.45 + (barH / canvasHeight) * 0.2;
          } else {
            ctx.globalAlpha = isPlayed
              ? 0.7
              : 0.25 + (barH / canvasHeight) * 0.2;
          }
        }

        if (barRadius > 0) {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, barRadius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, barH);
        }
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    active,
    analyser,
    processing,
    barWidth,
    barGap,
    barRadius,
    barColor,
    sensitivity,
    currentTime,
    duration,
    showProgress,
    progressColor,
    generateStaticPattern,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full",
        onScrub && duration > 0 && "cursor-pointer",
        className,
      )}
      style={{ height }}
      onMouseDown={handleMouseDown}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="block size-full"
        style={{ imageRendering: "crisp-edges" }}
      />
    </div>
  );
}
