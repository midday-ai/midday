import "@/styles/globals.css";
import { cn } from "@midday/ui";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactElement } from "react";
import { TRPCReactProvider } from "./providers";

export const runtime = "edge";
export const preferredRegion = "fra1";

const fontSans = Plus_Jakarta_Sans({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "Midday | Smart pre-accounting",
	description:
		"Automate financial tasks, stay organized, and make informed decisions effortlessly.",
};

export default function Layout({ children }: { children: ReactElement }) {
	return (
		<html lang="en">
			<body className={cn(fontSans.variable, "bg-background")}>{children}</body>
		</html>
	);
}
