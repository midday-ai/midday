import { useRef, useState } from "react";

/**
 * Custom hook for audio playback management.
 * @returns An object with methods and state for audio playback control.
 */
export function usePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);

  /**
   * Plays an audio stream.
   * @param stream - The ReadableStream containing audio data.
   * @param callback - Function to call when playback is complete.
   */
  async function play(stream: ReadableStream, callback: () => void) {
    stop();
    audioContext.current = new AudioContext({ sampleRate: 24000 });
    let nextStartTime = audioContext.current.currentTime;
    const reader = stream.getReader();
    let leftover = new Uint8Array();
    let result = await reader.read();
    setIsPlaying(true);

    while (!result.done && audioContext.current) {
      const data = new Uint8Array(leftover.length + result.value.length);
      data.set(leftover);
      data.set(result.value, leftover.length);
      const length = Math.floor(data.length / 4) * 4;
      const remainder = data.length % 4;
      const buffer = new Float32Array(data.buffer, 0, length / 4);
      leftover = new Uint8Array(data.buffer, length, remainder);

      const audioBuffer = audioContext.current.createBuffer(
        1,
        buffer.length,
        audioContext.current.sampleRate
      );
      audioBuffer.copyToChannel(buffer, 0);

      source.current = audioContext.current.createBufferSource();
      source.current.buffer = audioBuffer;
      source.current.connect(audioContext.current.destination);
      source.current.start(nextStartTime);
      nextStartTime += audioBuffer.duration;

      result = await reader.read();
      if (result.done) {
        source.current.onended = () => {
          stop();
          callback();
        };
      }
    }
  }

  /**
   * Stops the current audio playback.
   */
  function stop() {
    audioContext.current?.close();
    audioContext.current = null;
    setIsPlaying(false);
  }

  return {
    isPlaying,
    play,
    stop,
  };
}
