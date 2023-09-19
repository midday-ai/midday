import { cn } from "@midday/ui";
import { motion } from "framer-motion";
import { useFeatureStore } from "./store";

type FeatureCardProps = {
	gradient: string;
	children: React.ReactNode;
} & CardProps;

type CardProps = {
	id: string;
};

const FeatureCard = ({ gradient, children, id }: FeatureCardProps) => {
	const inViewFeature = useFeatureStore((state) => state.inViewFeature);
	const setFullscreenFeature = useFeatureStore(
		(state) => state.setFullscreenFeature,
	);

	return (
		<div
			className={cn(
				"absolute inset-0 h-full w-full rounded-2xl transition-opacity",
				inViewFeature === id
					? "active-card opacity-100"
					: "pointer-events-none opacity-0",
			)}
		>
			<div
				className={cn(
					"gradient absolute inset-0 origin-bottom-left rounded-2xl bg-gradient-to-br",
					gradient,
				)}
			/>
			{children}
			<button
				type="button"
				onClick={() => setFullscreenFeature(id)}
				className="show-me-btn absolute bottom-6 right-6 rounded-xl bg-black px-4 py-2 text-white shadow-lg"
			>
				Show me
			</button>
		</div>
	);
};

export const Todo = ({ id }: CardProps) => {
	return (
		<FeatureCard id={id} gradient="from-[#f7f0ff] to-[#a78afe]">
			<span />
		</FeatureCard>
	);
};

export const Colors = ({ id }: CardProps) => {
	return (
		<FeatureCard id={id} gradient="from-[#f5fbff] to-[#addeff]">
			<span />
		</FeatureCard>
	);
};

export const Availability = ({ id }: CardProps) => {
	return (
		<FeatureCard id={id} gradient="from-[#f5fff7] to-[#adf8ff]">
			<span />
		</FeatureCard>
	);
};

export const Music = ({ id }: CardProps) => {
	const fullscreenFeature = useFeatureStore((store) => store.fullscreenFeature);
	const isFullscreen = fullscreenFeature === id;

	return (
		<FeatureCard id={id} gradient="from-[#f7fff5] to-[#adffd8]">
			{/* <img
				alt=""
				className={cn(
					"absolute left-[10%] top-[10%] w-[20%] rounded-xl shadow-lg transition-transform",
					isFullscreen ? "scale-0" : "scale-100",
				)}
				src="/song-1.webp"
			/>
			<img
				alt=""
				className={cn(
					"absolute left-[70%] top-[20%] w-[25%] rounded-xl shadow-lg transition-transform",
					isFullscreen ? "scale-0" : "scale-100",
				)}
				src="/song-2.webp"
			/>
			<img
				alt=""
				className={cn(
					"absolute left-[20%] top-[60%] w-[30%] rounded-xl shadow-lg transition-transform",
					isFullscreen ? "scale-0" : "scale-100",
				)}
				src="/song-3.webp"
			/> */}

			{!isFullscreen && (
				<motion.div
					layoutId="spotify-logo"
					className="absolute left-[40%] top-32 h-48 w-24 rounded-[96px] bg-[#1bd761] p-3 shadow-lg"
				>
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
						<path
							d="M 38.196 21.276 C 30.46 16.682 17.7 16.26 10.314 18.502 C 9.128 18.862 7.875 18.191 7.515 17.005 C 7.155 15.819 7.826 14.566 9.012 14.206 C 17.49 11.632 31.582 12.13 40.488 17.416 C 41.506 18.07 41.823 19.412 41.205 20.452 C 40.587 21.492 39.257 21.856 38.196 21.276 Z M 37.944 28.082 C 37.402 28.962 36.251 29.237 35.37 28.698 C 28.92 24.734 19.086 23.584 11.454 25.9 C 10.806 26.125 10.086 25.977 9.579 25.514 C 9.072 25.052 8.858 24.349 9.023 23.682 C 9.188 23.016 9.704 22.493 10.368 22.32 C 19.084 19.676 29.92 20.956 37.328 25.51 C 38.208 26.05 38.484 27.204 37.944 28.082 Z M 35.006 34.616 C 34.8 34.955 34.467 35.199 34.082 35.292 C 33.696 35.386 33.288 35.322 32.95 35.114 C 27.314 31.67 20.22 30.892 11.866 32.8 C 11.07 32.961 10.291 32.458 10.111 31.667 C 9.93 30.875 10.413 30.084 11.2 29.884 C 20.342 27.794 28.184 28.694 34.51 32.56 C 34.849 32.767 35.091 33.099 35.184 33.485 C 35.277 33.871 35.213 34.278 35.006 34.616 Z M 24 0 C 10.746 0 0 10.746 0 24 C 0 37.256 10.746 48 24 48 C 37.256 48 48 37.256 48 24 C 48 10.746 37.256 0 24 0 Z"
							fill="hsl(0, 0%, 100%)"
						/>
					</svg>
				</motion.div>
			)}
		</FeatureCard>
	);
};

export const SchedulingLinks = ({ id }: CardProps) => {
	return (
		<FeatureCard id={id} gradient="from-[#fff7f5] to-[#ffd8ad]">
			<span />
		</FeatureCard>
	);
};

export const Team = ({ id }: CardProps) => {
	return (
		<FeatureCard id={id} gradient="from-[#fef5ff] to-[#ffade1]">
			<span />
		</FeatureCard>
	);
};
