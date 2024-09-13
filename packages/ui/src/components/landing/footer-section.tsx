import React from "react";
import Link from "next/link";
import { DiscordLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";

import { Icons } from "../icons";

/**
 * Interface for footer navigation item
 */
interface FooterNavItem {
  href: string;
  name: string;
}

/**
 * Interface for footer navigation section
 */
interface FooterNavSection {
  label: string;
  items: FooterNavItem[];
}

/**
 * Interface for footer social link
 */
interface FooterSocial {
  href: string;
  name: string;
  icon: JSX.Element;
}

/**
 * Array of footer navigation sections
 */
const footerNavs: FooterNavSection[] = [
  {
    label: "Product",
    items: [
      { href: "https://app-business.solomon-ai.app", name: "Business" },

      { href: "mailto:yoanyomba@solomon-ai.co", name: "Email" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "https://solomon-ai.app/terms", name: "Terms" },
      { href: "https://solomon-ai.app/policy", name: "Privacy" },
    ],
  },
];

/**
 * Array of footer social links
 */
const footerSocials: FooterSocial[] = [
  {
    href: "",
    name: "Discord",
    icon: <DiscordLogoIcon className="h-4 w-4" />,
  },
  {
    href: "",
    name: "Twitter",
    icon: <TwitterLogoIcon className="h-4 w-4" />,
  },
];

/**
 * SiteFooter component
 * @returns {JSX.Element} Rendered SiteFooter component
 */
export const FooterSection: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  return (
    <footer>
      <div className="mx-auto w-full max-w-screen-xl xl:pb-2">
        <div className="gap-4 p-4 px-8 py-16 sm:pb-16 md:flex md:justify-between">
          <FooterLogo title={title} description={description} />
          <FooterNavigation />
        </div>
        <FooterBottom title={title} />
      </div>
    </footer>
  );
};

/**
 * FooterLogo component
 * @returns {JSX.Element} Rendered FooterLogo component
 */
const FooterLogo: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="mb-12 flex flex-col gap-4">
    <Link href="/" className="flex items-center gap-2">
      <Icons.Logo />
      <span className="self-center whitespace-nowrap text-2xl font-semibold dark:text-white">
        {title}
      </span>
    </Link>
    <p className="max-w-md">{description}</p>
  </div>
);

/**
 * FooterNavigation component
 * @returns {JSX.Element} Rendered FooterNavigation component
 */
const FooterNavigation: React.FC = () => (
  <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
    {footerNavs.map((nav) => (
      <FooterNavSection key={nav.label} section={nav} />
    ))}
  </div>
);

/**
 * FooterNavSection component props
 */
interface FooterNavSectionProps {
  section: FooterNavSection;
}

/**
 * FooterNavSection component
 * @param {FooterNavSectionProps} props - The props for the FooterNavSection component
 * @returns {JSX.Element} Rendered FooterNavSection component
 */
const FooterNavSection: React.FC<FooterNavSectionProps> = ({ section }) => (
  <div>
    <h2 className="mb-6 text-sm font-medium uppercase tracking-tighter text-gray-900 dark:text-white">
      {section.label}
    </h2>
    <ul className="grid gap-2">
      {section.items.map((item) => (
        <li key={item.name}>
          <Link
            href={item.href}
            className="cursor-pointer text-sm font-[450] text-gray-400 duration-200 hover:text-gray-200"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

/**
 * FooterBottom component
 * @returns {JSX.Element} Rendered FooterBottom component
 */
const FooterBottom: React.FC<{
  title: string;
}> = ({ title }) => (
  <div className="flex flex-col gap-2 rounded-md border-neutral-700/20 px-8 py-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
    {/* <FooterSocialLinks /> */}
    <FooterCopyright title={title} />
  </div>
);

/**
 * FooterSocialLinks component
 * @returns {JSX.Element} Rendered FooterSocialLinks component
 */
const FooterSocialLinks: React.FC = () => (
  <div className="flex space-x-5 sm:mt-0 sm:justify-center">
    {footerSocials.map((social) => (
      <Link
        key={social.name}
        href={social.href}
        className="fill-gray-500 text-gray-500 hover:fill-gray-900 hover:text-gray-900 dark:hover:fill-gray-600 dark:hover:text-gray-600"
      >
        {social.icon}
        <span className="sr-only">{social.name}</span>
      </Link>
    ))}
  </div>
);

/**
 * FooterCopyright component
 * @returns {JSX.Element} Rendered FooterCopyright component
 */
const FooterCopyright: React.FC<{
  title: string;
}> = ({ title }) => (
  <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
    Copyright © {new Date().getFullYear()}{" "}
    <Link href="/" className="cursor-pointer">
      {title}
    </Link>
    . All Rights Reserved.
  </span>
);
