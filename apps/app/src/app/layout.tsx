import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactElement } from "react";

export const runtime = "edge";
export const preferredRegion = "fra1";

const fontSans = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Midday",
	description: "Simple monorepo with shared backend for web & mobile apps",
};

export default function Layout({ children }: { children: ReactElement }) {
	return (
		<html lang="en">
			<body className={["font-sans", fontSans.variable].join(" ")}>
				{children}
			</body>
		</html>
	);
}
