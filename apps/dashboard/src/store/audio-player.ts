import { create } from "zustand";

interface AudioPlayerState {
  /** Whether the audio player is visible */
  isVisible: boolean;
  /** The audio URL to play */
  audioUrl: string | null;
  /** Whether audio should auto-play when opened */
  autoPlay: boolean;

  /** Show the audio player with a URL and optionally auto-play */
  play: (audioUrl: string, autoPlay?: boolean) => void;
  /** Hide the audio player */
  close: () => void;
  /** Toggle visibility */
  toggle: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set) => ({
  isVisible: false,
  audioUrl: null,
  autoPlay: false,

  play: (audioUrl, autoPlay = true) =>
    set({
      isVisible: true,
      audioUrl,
      autoPlay,
    }),

  close: () =>
    set({
      isVisible: false,
      autoPlay: false,
      // Keep audioUrl so it can be resumed if needed
    }),

  toggle: () =>
    set((state) => ({
      isVisible: !state.isVisible,
    })),
}));
