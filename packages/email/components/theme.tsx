import { Font, Head, Html, Tailwind } from "@react-email/components";
import type React from "react";

// Re-export Button component for convenience
export { Button } from "./button";

// Email-optimized theme colors (avoiding pure white/black for better email client compatibility)
export const emailTheme = {
  light: {
    background: "#ffffff",
    foreground: "#0e0e0e", // Slightly off-black to prevent auto-inversion
    muted: "#6b7280",
    border: "#e5e7eb",
    accent: "#0e0e0e",
    secondary: "#9ca3af",
  },
  dark: {
    background: "#0C0C0C",
    foreground: "#fefefe", // Slightly off-white to prevent auto-inversion
    muted: "#a1a1aa",
    border: "#1D1D1D",
    accent: "#fefefe",
    secondary: "#6b7280",
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

// Comprehensive email theme provider that wraps everything
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
      <Tailwind>
        <Head>
          {/* Essential meta tags for email dark mode support */}
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />

          {/* Additional Gmail dark mode hints */}
          <meta
            name="theme-color"
            content="#0C0C0C"
            media="(prefers-color-scheme: dark)"
          />
          <meta
            name="theme-color"
            content="#ffffff"
            media="(prefers-color-scheme: light)"
          />
          <meta name="msapplication-navbutton-color" content="#0C0C0C" />

          {/* Dark mode styles */}
          <style>{getEmailDarkModeCSS()}</style>

          {/* Default fonts for all emails */}
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />

          {/* Additional head content */}
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

// Simplified theme hook
export function useEmailTheme() {
  return {
    classes: getEmailThemeClasses(),
    lightStyles: getEmailInlineStyles("light"),
    darkStyles: getEmailInlineStyles("dark"),
  };
}
