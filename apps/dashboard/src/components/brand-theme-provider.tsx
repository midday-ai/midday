"use client";

import type { ReactNode } from "react";

export type BrandTheme = {
  displayName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailFromName?: string;
  pdfFooterText?: string;
};

/**
 * Convert hex color to HSL values for CSS variables
 * Returns format: "210 100% 50%" (without parentheses)
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // Convert to degrees and percentages
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Validate hex color format
 */
function isValidHex(hex: string): boolean {
  return /^#?[0-9A-Fa-f]{6}$/.test(hex);
}

type BrandThemeProviderProps = {
  children: ReactNode;
  branding?: BrandTheme | null;
};

/**
 * BrandThemeProvider
 *
 * Wraps children with custom CSS variables for brand theming.
 * Use this in portal pages to apply per-team branding.
 *
 * Example usage:
 * ```tsx
 * <BrandThemeProvider branding={team.branding}>
 *   <PortalContent />
 * </BrandThemeProvider>
 * ```
 */
export function BrandThemeProvider({
  children,
  branding,
}: BrandThemeProviderProps) {
  // If no branding or no colors, just render children
  if (!branding?.primaryColor || !isValidHex(branding.primaryColor)) {
    return <>{children}</>;
  }

  const primaryHsl = hexToHsl(branding.primaryColor);
  const secondaryHsl = branding.secondaryColor && isValidHex(branding.secondaryColor)
    ? hexToHsl(branding.secondaryColor)
    : primaryHsl;

  // CSS custom properties to override
  const cssVariables = `
    :root {
      --primary: ${primaryHsl};
      --accent: ${primaryHsl};
    }
    .brand-secondary {
      --secondary: ${secondaryHsl};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      {children}
    </>
  );
}

/**
 * Hook to get brand display name with fallback
 */
export function useBrandDisplayName(
  branding?: BrandTheme | null,
  fallbackName?: string | null,
): string {
  if (branding?.displayName) {
    return branding.displayName;
  }
  return fallbackName || "Company";
}
