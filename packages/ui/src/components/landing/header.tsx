"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { AlignJustify, XIcon } from "lucide-react";

import { cn } from "../../utils";
import { buttonVariants } from "../button";

/**
 * Interface for menu item
 */
interface MenuItem {
  id: number;
  label: string;
  href: string;
}

/**
 * Array of menu items
 */
const menuItems: MenuItem[] = [
  { id: 1, label: "Features", href: "/features" },
  { id: 2, label: "Pricing", href: "#" },
  { id: 3, label: "Careers", href: "#" },
  { id: 4, label: "Contact Us", href: "#" },
];

/**
 * Animation variants for mobile navbar
 */
const mobileNavbarVariant: Variants = {
  initial: { opacity: 0, scale: 1 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.2, ease: "easeOut" },
  },
};

/**
 * Animation variants for mobile links
 */
const mobileLinkVar: Variants = {
  initial: { y: "-20px", opacity: 0 },
  open: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/**
 * Animation variants for container
 */
const containerVariants: Variants = {
  open: { transition: { staggerChildren: 0.06 } },
};

/**
 * HeaderSection component
 * @returns {JSX.Element} Rendered HeaderSection component
 */
export function HeaderSection(): JSX.Element {
  const [hamburgerMenuIsOpen, setHamburgerMenuIsOpen] = useState(false);

  useEffect(() => {
    const html = document.querySelector("html");
    if (html) html.classList.toggle("overflow-hidden", hamburgerMenuIsOpen);
  }, [hamburgerMenuIsOpen]);

  useEffect(() => {
    const closeHamburgerNavigation = () => setHamburgerMenuIsOpen(false);
    window.addEventListener("orientationchange", closeHamburgerNavigation);
    window.addEventListener("resize", closeHamburgerNavigation);

    return () => {
      window.removeEventListener("orientationchange", closeHamburgerNavigation);
      window.removeEventListener("resize", closeHamburgerNavigation);
    };
  }, []);

  return (
    <>
      <Header
        hamburgerMenuIsOpen={hamburgerMenuIsOpen}
        setHamburgerMenuIsOpen={setHamburgerMenuIsOpen}
      />
      <MobileNavbar
        hamburgerMenuIsOpen={hamburgerMenuIsOpen}
        setHamburgerMenuIsOpen={setHamburgerMenuIsOpen}
      />
    </>
  );
}

/**
 * Header component props
 */
interface HeaderProps {
  hamburgerMenuIsOpen: boolean;
  setHamburgerMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Header component
 * @param {HeaderProps} props - The props for the Header component
 * @returns {JSX.Element} Rendered Header component
 */
const Header: React.FC<HeaderProps> = ({
  hamburgerMenuIsOpen,
  setHamburgerMenuIsOpen,
}) => (
  <header className="animate-fade-in fixed left-0 top-0 z-50 w-full translate-y-[-1rem] border-b opacity-0 backdrop-blur-[12px] [--animation-delay:600ms]">
    <div className="container flex h-[3.5rem] items-center justify-between">
      <Link className="text-md flex items-center" href="/">
        Magic UI
      </Link>
      <HeaderLinks />
      <HamburgerButton
        hamburgerMenuIsOpen={hamburgerMenuIsOpen}
        setHamburgerMenuIsOpen={setHamburgerMenuIsOpen}
      />
    </div>
  </header>
);

/**
 * HeaderLinks component
 * @returns {JSX.Element} Rendered HeaderLinks component
 */
const HeaderLinks: React.FC = () => (
  <div className="ml-auto flex h-full items-center">
    <Link className="mr-6 text-sm" href="/signin">
      Log in
    </Link>
    <Link
      className={cn(buttonVariants({ variant: "secondary" }), "mr-6 text-sm")}
      href="/signup"
    >
      Sign up
    </Link>
  </div>
);

/**
 * HamburgerButton component props
 */
interface HamburgerButtonProps {
  hamburgerMenuIsOpen: boolean;
  setHamburgerMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * HamburgerButton component
 * @param {HamburgerButtonProps} props - The props for the HamburgerButton component
 * @returns {JSX.Element} Rendered HamburgerButton component
 */
const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  hamburgerMenuIsOpen,
  setHamburgerMenuIsOpen,
}) => (
  <button
    className="ml-6 md:hidden"
    onClick={() => setHamburgerMenuIsOpen((open) => !open)}
  >
    <span className="sr-only">Toggle menu</span>
    {hamburgerMenuIsOpen ? <XIcon /> : <AlignJustify />}
  </button>
);

/**
 * MobileNavbar component props
 */
interface MobileNavbarProps {
  hamburgerMenuIsOpen: boolean;
  setHamburgerMenuIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * MobileNavbar component
 * @param {MobileNavbarProps} props - The props for the MobileNavbar component
 * @returns {JSX.Element} Rendered MobileNavbar component
 */
const MobileNavbar: React.FC<MobileNavbarProps> = ({
  hamburgerMenuIsOpen,
  setHamburgerMenuIsOpen,
}) => (
  <AnimatePresence>
    <motion.nav
      initial="initial"
      exit="exit"
      variants={mobileNavbarVariant}
      animate={hamburgerMenuIsOpen ? "animate" : "exit"}
      className={cn(
        `fixed left-0 top-0 z-50 h-screen w-full overflow-auto bg-background/70 backdrop-blur-[12px]`,
        { "pointer-events-none": !hamburgerMenuIsOpen },
      )}
    >
      <div className="container flex h-[3.5rem] items-center justify-between">
        <Link className="text-md flex items-center" href="/">
          Magic UI
        </Link>
        <HamburgerButton
          hamburgerMenuIsOpen={hamburgerMenuIsOpen}
          setHamburgerMenuIsOpen={setHamburgerMenuIsOpen}
        />
      </div>
      <MobileNavbarLinks hamburgerMenuIsOpen={hamburgerMenuIsOpen} />
    </motion.nav>
  </AnimatePresence>
);

/**
 * MobileNavbarLinks component props
 */
interface MobileNavbarLinksProps {
  hamburgerMenuIsOpen: boolean;
}

/**
 * MobileNavbarLinks component
 * @param {MobileNavbarLinksProps} props - The props for the MobileNavbarLinks component
 * @returns {JSX.Element} Rendered MobileNavbarLinks component
 */
const MobileNavbarLinks: React.FC<MobileNavbarLinksProps> = ({
  hamburgerMenuIsOpen,
}) => (
  <motion.ul
    className={`flex flex-col uppercase ease-in md:flex-row md:items-center md:normal-case`}
    variants={containerVariants}
    initial="initial"
    animate={hamburgerMenuIsOpen ? "open" : "exit"}
  >
    {menuItems.map((item) => (
      <motion.li
        variants={mobileLinkVar}
        key={item.id}
        className="border-grey-dark border-b py-0.5 pl-6 md:border-none"
      >
        <Link
          className={`hover:text-grey flex h-[var(--navigation-height)] w-full items-center text-xl transition-[color,transform] duration-300 md:translate-y-0 md:text-sm md:transition-colors ${
            hamburgerMenuIsOpen ? "[&_a]:translate-y-0" : ""
          }`}
          href={item.href}
        >
          {item.label}
        </Link>
      </motion.li>
    ))}
  </motion.ul>
);
