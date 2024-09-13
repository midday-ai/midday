"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import CalButton from "../cal-embed";

export function useScrollY(containerRef: React.RefObject<HTMLElement>) {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollY(containerRef.current.scrollTop);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, [containerRef]);

    return scrollY;
}

export function StickyHeader({
    containerRef,
}: {
    containerRef: React.RefObject<HTMLElement>;
}) {
    const scrollY = useScrollY(containerRef);
    const stickyNavRef = useRef<HTMLElement>(null);
    const { theme } = useTheme();
    const [active, setActive] = useState(false);

    const navLinks = useMemo(
        () => [
            { id: 0, label: "Home", link: "/" },
            { id: 1, label: "Product", link: "https://app-business.solomon-ai.app" },
            { id: 2, label: "About", link: "https://solomon-ai.app" },
            { id: 3, label: "Audit", link: "/audit" },
            { id: 4, label: "Checklist", link: "/checklist" },
            { id: 5, label: "Case Study", link: "/pitch" },
        ],
        [],
    );

    return (
        <header ref={stickyNavRef} className="sticky top-0 z-50 px-10 py-7 xl:px-0">
            <nav className="relative mx-auto flex items-center justify-between md:max-w-6xl">
                <Icons.Logo width={50} height={50} />

                <ul className="sticky left-4 right-4 top-4 z-[60] hidden items-center justify-center gap-x-5 md:flex">
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{
                            boxShadow:
                                scrollY >= 120
                                    ? theme === "dark"
                                        ? "0 0 0 1px rgba(255,255,255,.08), 0 1px 2px -1px rgba(255,255,255,.08), 0 2px 4px rgba(255,255,255,.04)"
                                        : "0 0 0 1px rgba(17,24,28,.08), 0 1px 2px -1px rgba(17,24,28,.08), 0 2px 4px rgba(17,24,28,.04)"
                                    : "none",
                        }}
                        transition={{
                            ease: "linear",
                            duration: 0.05,
                            delay: 0.05,
                        }}
                        className="flex h-12 w-auto items-center justify-center overflow-hidden rounded-full px-6 py-2.5 transition-all bg-black md:p-1.5 md:py-2"
                    >
                        <nav className="relative h-full items-center justify-between gap-x-3.5 md:flex">
                            <ul className="flex h-full flex-col justify-center gap-6 md:flex-row md:justify-start md:gap-0 lg:gap-1">
                                {navLinks.map((navItem) => (
                                    <li
                                        key={navItem.id}
                                        className="flex items-center justify-center px-[0.75rem] py-[0.375rem] font-bold"
                                    >
                                        <a href={navItem.link}>{navItem.label}</a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: scrollY >= 120 ? "auto" : 0,
                            }}
                            transition={{
                                ease: "linear",
                                duration: 0.25,
                                delay: 0.05,
                            }}
                            className="!hidden overflow-hidden rounded-full md:!block"
                        >
                            <AnimatePresence>
                                {scrollY >= 120 && (
                                    <motion.ul
                                        initial={{ x: "125%" }}
                                        animate={{ x: "0" }}
                                        exit={{
                                            x: "125%",
                                            transition: { ease: "linear", duration: 1 },
                                        }}
                                        transition={{ ease: "linear", duration: 0.3 }}
                                        className="shrink-0 whitespace-nowrap"
                                    >
                                        <li>
                                            <div
                                                className="relative inline-flex w-fit items-center justify-center gap-x-1.5 overflow-hidden rounded-full bg-primary px-3 py-1.5 text-primary-foreground outline-none "
                                            >
                                                <CalButton text="Book a call" enableIcon={false} />
                                            </div>
                                        </li>
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                </ul>

                <motion.div
                    className="z-[999] hidden items-center gap-x-5 md:flex"
                    animate={{
                        y: scrollY >= 120 ? -50 : 0,
                        opacity: scrollY >= 120 ? 0 : 1,
                    }}
                    transition={{ duration: 0.15 }}
                >
                    <CalButton text="Contact Our Team" enableIcon={false} />
                </motion.div>
                <MotionConfig transition={{ duration: 0.3, ease: "easeInOut" }}>
                    <motion.button
                        onClick={() => setActive((prev) => !prev)}
                        animate={active ? "open" : "close"}
                        className="relative flex h-8 w-8 items-center justify-center rounded-md md:hidden"
                    >
                        <motion.span
                            style={{ left: "50%", top: "35%", x: "-50%", y: "-50%" }}
                            className="absolute h-0.5 w-5 bg-black dark:bg-white"
                            variants={{
                                open: {
                                    rotate: ["0deg", "0deg", "45deg"],
                                    top: ["35%", "50%", "50%"],
                                },
                                close: {
                                    rotate: ["45deg", "0deg", "0deg"],
                                    top: ["50%", "50%", "35%"],
                                },
                            }}
                            transition={{ duration: 0.3 }}
                        ></motion.span>
                        <motion.span
                            style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
                            className="absolute h-0.5 w-5 bg-black dark:bg-white"
                            variants={{
                                open: {
                                    opacity: 0,
                                },
                                close: {
                                    opacity: 1,
                                },
                            }}
                        ></motion.span>
                        <motion.span
                            style={{ left: "50%", bottom: "30%", x: "-50%", y: "-50%" }}
                            className="absolute h-0.5 w-5 bg-black dark:bg-white"
                            variants={{
                                open: {
                                    rotate: ["0deg", "0deg", "-45deg"],
                                    top: ["65%", "50%", "50%"],
                                },
                                close: {
                                    rotate: ["-45deg", "0deg", "0deg"],
                                    top: ["50%", "50%", "65%"],
                                },
                            }}
                            transition={{ duration: 0.3 }}
                        ></motion.span>
                    </motion.button>
                </MotionConfig>
            </nav>
        </header>
    );
}

export function Header() {
    const containerRef = useRef(null);

    return (
        <main
            ref={containerRef}
            // className="h-[10vh] w-full"
        >
            <StickyHeader containerRef={containerRef} />
        </main>
    );
}
