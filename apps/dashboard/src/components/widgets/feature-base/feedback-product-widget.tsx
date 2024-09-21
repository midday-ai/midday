"use client"; // NextJS 13 requires this. Remove if you are using NextJS 12 or lower
import { Button, buttonVariants } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  ExclamationTriangleIcon,
  QuestionMarkIcon,
} from "@radix-ui/react-icons";
import { BracketsIcon, Microscope } from "lucide-react";
import Script from "next/script";
import { useEffect } from "react";

// Separate types for better organization
/**
 * Represents the possible placement options for the Featurebase widget.
 */
type FeaturebasePlacement = "right" | "left" | "top" | "bottom";

/**
 * Represents the theme options for the Featurebase widget.
 */
type FeaturebaseTheme = "light" | "dark";

/**
 * Represents a company associated with a user in Featurebase.
 */
interface Company {
  /** Unique identifier for the company */
  id: string;
  /** Name of the company */
  name: string;
  /** Optional monthly spend amount for the company */
  monthlySpend?: number;
  /** Optional creation date of the company */
  createdAt?: string;
  /** Optional custom fields for the company */
  customFields?: Record<string, any>;
}

/**
 * Props for the AdminProductWidget component.
 */
export interface FeedbackProductWidgetProps {
  /** The organization name in Featurebase */
  organization: string;
  /** The placement of the widget */
  placement?: FeaturebasePlacement;
  /** The theme of the widget */
  theme: FeaturebaseTheme;
  /** The locale for the widget */
  locale: string;
  /** The name of the user */
  usersName: string;
  /** Optional JWT token for authentication */
  token?: string;
  /** Optional CSS class name */
  className?: string;
  /** The email of the user */
  email: string;
  /** The name of the user */
  name: string;
  /** The unique identifier of the user */
  id: string;
  /** Optional URL of the user's profile picture */
  profilePicture?: string;
}

const FeedbackProductWidget: React.FC<FeedbackProductWidgetProps> = ({
  organization,
  placement = "left",
  theme,
  locale = "en",
  usersName,
  token = "",
  className,
  email,
  name,
  id,
  profilePicture,
}) => {
  useEffect(() => {
    initializeFeaturebase();
  }, [
    organization,
    placement,
    theme,
    locale,
    usersName,
    token,
    email,
    name,
    id,
    profilePicture,
  ]);

  /**
   * Initializes the Featurebase widget by setting up the global Featurebase function
   * and calling it with the necessary configuration options.
   */
  const initializeFeaturebase = () => {
    const win = window as any;
    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }

    win.Featurebase(
      "initialize_feedback_widget",
      getInitializeOptions(),
      "identify",
      getIdentifyOptions(),
      handleIdentifyCallback,
    );
  };

  /**
   * Returns the initialization options for the Featurebase widget.
   * @returns An object containing the initialization options
   */
  const getInitializeOptions = () => ({
    organization,
    theme,
    placement,
    email,
    locale,
    token,
  });

  /**
   * Returns the identification options for the Featurebase widget.
   * @returns An object containing the identification options
   */
  const getIdentifyOptions = () => ({
    organization,
    email,
    name,
    id,
    profilePicture,
  });

  /**
   * Handles the callback after Featurebase identification.
   * @param err - Error object if identification failed, null otherwise
   */
  const handleIdentifyCallback = (err: Error | null) => {
    if (err) {
      console.error("Featurebase identification failed:", err);
    } else {
      console.log("Featurebase identification successful");
    }
  };

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      <div className={cn(className)}>
        <button
          className="inline-flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Open feedback"
          data-featurebase-feedback
        >
          <Microscope className="h-5 w-5" />
          <span id="fb-update-badge"></span>
        </button>
      </div>
    </>
  );
};

export default FeedbackProductWidget;
