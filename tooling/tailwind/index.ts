import type { Config } from "tailwindcss";

export default {
	content: [""],
	theme: {
		extend: {
			fontFamily: {
				display: "var(--display-sans)",
				body: "var(--body-sans)",
			},
			colors: {
				background: "#141414",
			},
		},
	},
	plugins: [],
} satisfies Config;
