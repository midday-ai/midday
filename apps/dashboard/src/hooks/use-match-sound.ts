"use client";

import { useCallback } from "react";

/**
 * Hook to play a clean, minimal notification sound when a receipt matches.
 * Two-note ascending pattern - simple and satisfying.
 */
export function useMatchSound() {
  const play = useCallback(() => {
    try {
      const audioContext = new AudioContext();
      const now = audioContext.currentTime;

      // Two clean notes: G5 → C6 (perfect fourth, sounds complete)
      const notes = [
        { freq: 784, time: 0, duration: 0.08 },
        { freq: 1047, time: 0.07, duration: 0.1 },
      ];

      notes.forEach(({ freq, time, duration }, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = now + time;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.start(start);
        osc.stop(start + duration);

        if (i === notes.length - 1) {
          osc.onended = () => audioContext.close();
        }
      });
    } catch {
      // Silently fail if audio not supported
    }
  }, []);

  return { play };
}
