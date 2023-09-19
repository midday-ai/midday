import { create } from "zustand";

type FeaturesStore = {
	inViewFeature: string | null;
	setInViewFeature: (feature: string | null) => void;
	fullscreenFeature: string | null;
	setFullscreenFeature: (feature: string | null) => void;
	lastFullscreenFeature: string | null;
	setLastFullscreenFeature: (feature: string | null) => void;
};

export const useFeatureStore = create<FeaturesStore>((set) => ({
	inViewFeature: null,
	setInViewFeature: (feature: string | null) => set({ inViewFeature: feature }),
	fullscreenFeature: null,
	setFullscreenFeature: (feature: string | null) => {
		set({ fullscreenFeature: feature });
		if (feature !== null) {
			set({ lastFullscreenFeature: feature });
		}
	},
	lastFullscreenFeature: null,
	setLastFullscreenFeature: (feature: string | null) =>
		set({ lastFullscreenFeature: feature }),
}));
