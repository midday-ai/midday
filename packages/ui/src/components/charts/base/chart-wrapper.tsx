"use client";

import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import React, { ReactNode, useCallback, useEffect, useState } from "react";

import { Button } from "../../button";

/**
 * Props for the ChartWrapper component.
 */
interface ChartWrapperProps {
  /** The content to be wrapped and revealed */
  children: ReactNode;
  /** Text to display on the button when closed */
  buttonText?: string;
  /** Text to display on the button when open (optional) */
  openButtonText?: string;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Whether the wrapper should be initially open */
  initiallyOpen?: boolean;
  /** Callback function triggered when the wrapper opens */
  onOpen?: () => void;
  /** Callback function triggered when the wrapper closes */
  onClose?: () => void;
  /** Duration of the open/close animation in milliseconds */
  animationDuration?: number;
}

/**
 * A wrapper component with a toggleable button at the bottom left.
 * The button reveals or hides the wrapped content.
 *
 * @example
 * <ChartWrapper
 *   buttonText="Open"
 *   openButtonText="Close"
 *   onOpen={() => console.log('Opened')}
 * >
 *   <div>Content to be revealed</div>
 * </ChartWrapper>
 */
export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  buttonText,
  openButtonText,
  className = "",
  initiallyOpen = false,
  onOpen,
  onClose,
  animationDuration = 300,
}) => {
  // State to track whether the content is open or closed
  const [isOpen, setIsOpen] = useState<boolean>(initiallyOpen);

  // Memoized toggle function to prevent unnecessary re-renders
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  // Effect to trigger onOpen or onClose callbacks
  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [isOpen, onOpen, onClose]);

  // Determine the current button text
  const buttonIcon = isOpen ? (
    <CaretDownIcon className="h-4 w-4" />
  ) : (
    <CaretRightIcon className="h-4 w-4" />
  );

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toggle button */}
      <Button
        onClick={toggleOpen}
        className="self-start rounded-md bg-background text-foreground transition-all hover:bg-background focus:outline-none focus:ring-2 focus:ring-background focus:ring-opacity-50"
        variant="outline"
        size="sm"
        style={{ transitionDuration: `${animationDuration / 2}ms` }}
        aria-expanded={isOpen}
      >
        {buttonIcon}
        <span className="ml-2">{isOpen ? openButtonText : buttonText}</span>
      </Button>
      {/* Wrapper for the revealing content */}
      <div
        className={`mt-2 overflow-hidden transition-all ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ transitionDuration: `${animationDuration}ms` }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Custom hook to use the ChartWrapper state in child components.
 * @param initialState - The initial open state
 * @returns An object containing the current state and a toggle function
 *
 * @example
 * const { isOpen, toggleOpen } = useWrapperState(false);
 */
export const useWrapperState = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, toggleOpen };
};

export default ChartWrapper;
