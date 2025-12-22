"use client";

import { useCallback } from "react";

/**
 * Hook to play a short, clean success sound using the Web Audio API.
 */
export function useSuccessSound() {
  const play = useCallback(() => {
    try {
      const audioContext = new AudioContext();
      const now = audioContext.currentTime;

      // Create two quick ascending notes for a clean "ding-ding" success sound
      const frequencies = [880, 1318.5]; // A5 -> E6

      frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = "sine";
        osc.frequency.value = freq;

        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

        osc.start(startTime);
        osc.stop(startTime + 0.12);

        if (i === frequencies.length - 1) {
          osc.onended = () => audioContext.close();
        }
      });
    } catch {
      // Silently fail if audio is not supported or blocked
    }
  }, []);

  return { play };
}
