import { Font, Head, Html, Tailwind } from "@react-email/components";
import type React from "react";

// Re-export Button component for convenience
export { Button } from "./button";

// Email-optimized theme colors (avoiding pure white/black for better email client compatibility)
export const emailTheme = {
  light: {
    background: "#ffffff",
    foreground: "#121212",
    muted: "#616161",
    border: "#dbd9d5",
    accent: "#121212",
    secondary: "#878787",
  },
  dark: {
    background: "#0d0d0d",
    foreground: "#fafafa",
    muted: "#616161",
    border: "#1c1c1c",
    accent: "#fafafa",
    secondary: "#616161",
  },
} as const;

// Industry-standard dark mode CSS for email clients
export const getEmailDarkModeCSS = () => {
  return `
    /* Root CSS for email dark mode support */
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }

    /* Apple Mail, iOS Mail, and some webview clients */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: ${emailTheme.dark.background} !important;
        color: ${emailTheme.dark.foreground} !important;
      }
      .email-container {
        border-color: ${emailTheme.dark.border} !important;
      }
      .email-text {
        color: ${emailTheme.dark.foreground} !important;
      }
      .email-muted {
        color: ${emailTheme.dark.muted} !important;
      }
      .email-secondary {
        color: ${emailTheme.dark.secondary} !important;
      }
      .email-accent {
        color: ${emailTheme.dark.accent} !important;
        border-color: ${emailTheme.dark.accent} !important;
      }
      .email-border {
        border-color: ${emailTheme.dark.border} !important;
      }
      .email-highlight {
        background-color: #1a1a1a !important;
        border-color: ${emailTheme.dark.border} !important;
      }
      .email-highlight-text {
        color: ${emailTheme.dark.foreground} !important;
      }
      
      /* Image swapping for dark mode */
      .dark-mode-hide {
        display: none !important;
      }
      .dark-mode-show {
        display: block !important;
      }
    }

    /* Gmail Desktop Dark Mode - Multiple targeting approaches */
    @media (prefers-color-scheme: dark) {
      /* Gmail specific selectors */
      .gmail_dark .email-body,
      .gmail_dark_theme .email-body,
      [data-darkmode="true"] .email-body {
        background-color: ${emailTheme.dark.background} !important;
        color: ${emailTheme.dark.foreground} !important;
      }
      .gmail_dark .email-container,
      .gmail_dark_theme .email-container,
      [data-darkmode="true"] .email-container {
        border-color: ${emailTheme.dark.border} !important;
      }
      .gmail_dark .email-text,
      .gmail_dark_theme .email-text,
      [data-darkmode="true"] .email-text {
        color: ${emailTheme.dark.foreground} !important;
      }
      .gmail_dark .email-muted,
      .gmail_dark_theme .email-muted,
      [data-darkmode="true"] .email-muted {
        color: ${emailTheme.dark.muted} !important;
      }
      .gmail_dark .email-accent,
      .gmail_dark_theme .email-accent,
      [data-darkmode="true"] .email-accent {
        color: ${emailTheme.dark.accent} !important;
        border-color: ${emailTheme.dark.accent} !important;
      }
      .gmail_dark .email-highlight,
      .gmail_dark_theme .email-highlight,
      [data-darkmode="true"] .email-highlight {
        background-color: #1a1a1a !important;
        border-color: ${emailTheme.dark.border} !important;
      }
      .gmail_dark .email-highlight-text,
      .gmail_dark_theme .email-highlight-text,
      [data-darkmode="true"] .email-highlight-text {
        color: ${emailTheme.dark.foreground} !important;
      }
    }

    /* Gmail Desktop conditional dark mode targeting */
    @media screen and (prefers-color-scheme: dark) {
      /* More aggressive Gmail desktop targeting */
      div[style*="background"] .email-body,
      .ii .email-body {
        background-color: ${emailTheme.dark.background} !important;
        color: ${emailTheme.dark.foreground} !important;
      }
      div[style*="background"] .email-container,
      .ii .email-container {
        border-color: ${emailTheme.dark.border} !important;
      }
      div[style*="background"] .email-text,
      .ii .email-text {
        color: ${emailTheme.dark.foreground} !important;
      }
      div[style*="background"] .email-muted,
      .ii .email-muted {
        color: ${emailTheme.dark.muted} !important;
      }
      div[style*="background"] .email-accent,
      .ii .email-accent {
        color: ${emailTheme.dark.accent} !important;
        border-color: ${emailTheme.dark.accent} !important;
      }
      div[style*="background"] .email-highlight,
      .ii .email-highlight {
        background-color: #1a1a1a !important;
        border-color: ${emailTheme.dark.border} !important;
      }
      div[style*="background"] .email-highlight-text,
      .ii .email-highlight-text {
        color: ${emailTheme.dark.foreground} !important;
      }
    }

    /* Outlook Web App and Outlook mobile targeting */
    [data-ogsc] .email-text {
      color: ${emailTheme.dark.foreground} !important;
    }
    [data-ogsc] .email-muted {
      color: ${emailTheme.dark.muted} !important;
    }
    [data-ogsc] .email-accent {
      color: ${emailTheme.dark.accent} !important;
      border-color: ${emailTheme.dark.accent} !important;
    }
    [data-ogsc] .email-highlight {
      background-color: #1a1a1a !important;
      border-color: ${emailTheme.dark.border} !important;
    }
    [data-ogsc] .email-highlight-text {
      color: ${emailTheme.dark.foreground} !important;
    }
    [data-ogsc] .dark-mode-hide {
      display: none !important;
    }
    [data-ogsc] .dark-mode-show {
      display: block !important;
    }

    /* Outlook background targeting */
    [data-ogsb] .email-body {
      background-color: ${emailTheme.dark.background} !important;
    }
    [data-ogsb] .email-container {
      border-color: ${emailTheme.dark.border} !important;
    }
  `;
};

interface EmailThemeProviderProps {
  children: React.ReactNode;
  preview?: React.ReactNode;
  additionalHeadContent?: React.ReactNode;
}

export function EmailThemeProvider({
  children,
  preview,
  additionalHeadContent,
}: EmailThemeProviderProps) {
  return (
    <Html>
      <Tailwind
        config={{
          theme: {
            extend: {
              fontFamily: {
                sans: [
                  "Hedvig Letters Sans",
                  "system-ui",
                  "Arial",
                  "sans-serif",
                ],
                serif: ["Hedvig Letters Serif", "Georgia", "serif"],
              },
            },
          },
        }}
      >
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <meta
            name="theme-color"
            content="#0d0d0d"
            media="(prefers-color-scheme: dark)"
          />
          <meta
            name="theme-color"
            content="#ffffff"
            media="(prefers-color-scheme: light)"
          />
          <meta name="msapplication-navbutton-color" content="#0d0d0d" />

          <style>{getEmailDarkModeCSS()}</style>

          {/* Body font — Hedvig Letters Sans (matches website) */}
          <Font
            fontFamily="Hedvig Letters Sans"
            fallbackFontFamily={["Arial", "Helvetica"]}
            webFont={{
              url: "https://fonts.gstatic.com/s/hedvigletterssans/v2/CHy_V_PfGVjobSBkihHWDT98RVp37w8jcJpH3B4jm10.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          {/* Heading font — Hedvig Letters Serif (loaded via @font-face only, not applied globally) */}
          <style>{`
            @font-face {
              font-family: 'Hedvig Letters Serif';
              font-style: normal;
              font-weight: 400;
              src: url(https://fonts.gstatic.com/s/hedviglettersserif/v4/OD5puN2I2mekHmyoU1Kj2AREd0--KMm6yXkk.woff2) format('woff2');
            }
          `}</style>

          {additionalHeadContent}
        </Head>
        {preview}
        {children}
      </Tailwind>
    </Html>
  );
}

// Email-optimized theme classes (no Tailwind dependencies)
export function getEmailThemeClasses() {
  return {
    // Base classes that work across email clients
    body: "email-body",
    container: "email-container",
    heading: "email-text",
    text: "email-text",
    mutedText: "email-muted",
    secondaryText: "email-secondary",
    button: "email-accent",
    border: "email-border",
    link: "email-text",
    mutedLink: "email-muted",

    // Dark mode image control
    hideInDark: "dark-mode-hide",
    showInDark: "dark-mode-show",
  };
}

// Utility to get inline styles (fallback for older email clients)
export function getEmailInlineStyles(mode: "light" | "dark" = "light") {
  const theme = emailTheme[mode];
  return {
    body: {
      backgroundColor: theme.background,
      color: theme.foreground,
    },
    container: {
      borderColor: theme.border,
    },
    text: {
      color: theme.foreground,
    },
    mutedText: {
      color: theme.muted,
    },
    secondaryText: {
      color: theme.secondary,
    },
    button: {
      color: theme.accent,
      borderColor: theme.accent,
    },
  };
}

// Simplified theme hook for email components
export function useEmailTheme() {
  return {
    classes: getEmailThemeClasses(),
    lightStyles: getEmailInlineStyles("light"),
  };
}
