"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/plate-editor/plate-ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";

/**
 * Props for the PlateEditorTooltipProvider component.
 * Extends both ThemeProviderProps and TooltipProviderProps to allow full customization.
 */
export interface PlateEditorTooltipProviderProps extends ThemeProviderProps {
  /**
   * Optional prop to override the default delay duration for tooltips.
   */
  customDelayDuration?: number;

  /**
   * Optional prop to disable hoverable content in tooltips.
   */
  disableHoverableContent?: boolean;

  /**
   * Optional prop to override the default skip delay duration for tooltips.
   */
  skipDelayDuration?: number;
}

/**
 * PlateEditorTooltipProvider component.
 *
 * This component wraps its children with both NextThemesProvider and TooltipProvider,
 * providing theme support and customizable tooltips for the Plate editor.
 *
 * @param props - The component props
 * @param props.children - The child components to be wrapped
 * @param props.customDelayDuration - Optional custom delay duration for tooltips
 * @param props.disableHoverableContent - Whether to disable hoverable content in tooltips
 * @param props.skipDelayDuration - Duration to skip delay when quickly moving between tooltips
 *
 * @example
 * ```tsx
 * <PlateEditorTooltipProvider>
 *   <YourEditorComponent />
 * </PlateEditorTooltipProvider>
 * ```
 */
export function PlateEditorTooltipProvider({
  children,
  customDelayDuration,
  disableHoverableContent = true,
  skipDelayDuration = 0,
  ...props
}: PlateEditorTooltipProviderProps) {
  // Use custom delay duration if provided, otherwise fallback to default
  const delayDuration = customDelayDuration ?? 500;

  return (
    <NextThemesProvider {...props}>
      <TooltipProvider
        disableHoverableContent={disableHoverableContent}
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
      >
        {children}
      </TooltipProvider>
    </NextThemesProvider>
  );
}

/**
 * A hook to access the PlateEditorTooltipProvider context.
 * This is a placeholder and should be implemented if needed.
 *
 * @returns The context value of PlateEditorTooltipProvider
 * @throws Error if used outside of PlateEditorTooltipProvider
 */
export function usePlateEditorTooltipContext() {
  // Implementation would go here
  throw new Error(
    "usePlateEditorTooltipContext must be used within a PlateEditorTooltipProvider",
  );
}
