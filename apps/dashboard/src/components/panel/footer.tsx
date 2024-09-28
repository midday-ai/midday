import config from "@/config";
import Link from "next/link";
import React from "react";

/**
 * Props for the Footer component.
 */
interface FooterProps {
  /** The main text content of the footer */
  mainText?: string;
  /** The URL for the first link */
  firstLinkUrl?: string;
  /** The text for the first link */
  firstLinkText?: string;
  /** The URL for the second link */
  secondLinkUrl?: string;
  /** The text for the second link */
  secondLinkText?: string;
}

/**
 * Footer component that displays attribution and links.
 * It can be customized with different text and link options.
 *
 * @param {FooterProps} props - The component props
 * @returns {React.ReactElement} The rendered Footer component
 */
export const Footer: React.FC<FooterProps> = React.memo(
  ({
    mainText = "Copyright",
    firstLinkUrl = config.webUrl,
    firstLinkText = config.company,
    secondLinkUrl = "https://github.com/salimi-my/shadcn-ui-sidebar",
    secondLinkText = "GitHub",
  }) => {
    return (
      <footer className="z-20 w-full bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-4 flex h-14 items-center md:mx-8">
          <p className="text-left text-xs leading-loose text-muted-foreground md:text-sm">
            {mainText} . © {new Date().getFullYear()} Solomon AI.
          </p>
        </div>
      </footer>
    );
  },
);

Footer.displayName = "Footer";

/**
 * Default props for the Footer component.
 */
Footer.defaultProps = {
  mainText: "Copyright",
  firstLinkUrl: "https://solomon-ai.app",
  firstLinkText: "Solomon AI",
  secondLinkUrl: "https://github.com/salimi-my/shadcn-ui-sidebar",
  secondLinkText: "GitHub",
};
