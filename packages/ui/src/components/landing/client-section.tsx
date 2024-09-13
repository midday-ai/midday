"use client";

import React from "react";

/**
 * Interface for client logo information
 * @interface ClientLogo
 */
interface ClientLogo {
  /** The name of the client company */
  name: string;
  /** The URL of the client's logo image */
  logoUrl: string;
}

/**
 * Array of client logos to be displayed
 */
const clientLogos: ClientLogo[] = [
  {
    name: "Playbook Media",
    logoUrl: "https://cdn.magicui.design/companies/Google.svg",
  },
  {
    name: "Street Ready",
    logoUrl: "https://cdn.magicui.design/companies/Microsoft.svg",
  },
  {
    name: "PromptMD",
    logoUrl: "https://cdn.magicui.design/companies/GitHub.svg",
  },
];

/**
 * ClientSection component displays a list of client logos
 * @returns {JSX.Element} The rendered ClientSection component
 */
export default function ClientSection(): JSX.Element {
  return (
    <section
      id="clients"
      className="mx-auto max-w-[80rem] px-6 text-center md:px-8"
    >
      <div className="py-14">
        <div className="mx-auto max-w-screen-xl px-4 md:px-8">
          <ClientSectionHeader />
          <ClientLogoList logos={clientLogos} />
        </div>
      </div>
    </section>
  );
}

/**
 * ClientSectionHeader component displays the header text for the client section
 * @returns {JSX.Element} The rendered ClientSectionHeader component
 */
function ClientSectionHeader(): JSX.Element {
  return (
    <h2 className="text-center text-sm font-semibold text-gray-600">
      TRUSTED BY TEAMS FROM AROUND THE WORLD
    </h2>
  );
}

/**
 * Props for the ClientLogoList component
 * @interface ClientLogoListProps
 */
interface ClientLogoListProps {
  /** Array of client logos to be displayed */
  logos: ClientLogo[];
}

/**
 * ClientLogoList component displays a list of client logos
 * @param {ClientLogoListProps} props - The props for the ClientLogoList component
 * @returns {JSX.Element} The rendered ClientLogoList component
 */
function ClientLogoList({ logos }: ClientLogoListProps): JSX.Element {
  return (
    <div className="mt-6">
      <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16 [&_path]:fill-white">
        {logos.map((logo) => (
          <ClientLogo key={logo.name} {...logo} />
        ))}
      </ul>
    </div>
  );
}

/**
 * ClientLogo component displays a single client logo
 * @param {ClientLogo} props - The props for the ClientLogo component
 * @returns {JSX.Element} The rendered ClientLogo component
 */
function ClientLogo({ name, logoUrl }: ClientLogo): JSX.Element {
  return (
    <li>
      {/* <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
            /> */}
      <span className="h-8 w-28 px-2 dark:brightness-0 dark:invert">
        {name}
      </span>
    </li>
  );
}
