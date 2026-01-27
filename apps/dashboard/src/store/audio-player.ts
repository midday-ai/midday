import { create } from "zustand";

interface AudioPlayerState {
  /** Whether the audio player is visible */
  isVisible: boolean;
  /** The audio URL to play */
  audioUrl: string | null;
  /** Whether audio should auto-play when opened */
  autoPlay: boolean;
  /** Whether audio is being generated/loaded */
  isLoading: boolean;

  /** Show the audio player with a URL and optionally auto-play */
  play: (audioUrl: string, autoPlay?: boolean) => void;
  /** Show the audio player in loading state (for lazy generation) */
  showLoading: () => void;
  /** Set the audio URL (after loading completes) */
  setUrl: (audioUrl: string, autoPlay?: boolean) => void;
  /** Hide the audio player */
  close: () => void;
  /** Toggle visibility */
  toggle: () => void;
}

export const useAudioPlayerStore = create<AudioPlayerState>()((set) => ({
  isVisible: false,
  audioUrl: null,
  autoPlay: false,
  isLoading: false,

  play: (audioUrl, autoPlay = true) =>
    set({
      isVisible: true,
      audioUrl,
      autoPlay,
      isLoading: false,
    }),

  showLoading: () =>
    set({
      isVisible: true,
      audioUrl: null,
      autoPlay: true,
      isLoading: true,
    }),

  setUrl: (audioUrl, autoPlay = true) =>
    set({
      audioUrl,
      autoPlay,
      isLoading: false,
    }),

  close: () =>
    set({
      isVisible: false,
      autoPlay: false,
      isLoading: false,
      // Keep audioUrl so it can be resumed if needed
    }),

  toggle: () =>
    set((state) => ({
      isVisible: !state.isVisible,
    })),
}));
