"use client";

import { useEffect } from "react";

/**
 * Interface for Intercom settings.
 * @interface IntercomSettings
 */
interface IntercomSettings {
  /** The base URL for the Intercom API. */
  api_base: string;
  /** The unique identifier for your Intercom app. */
  app_id: string;
}

/**
 * Props for the IntercomWidget.
 * @interface IntercomWidgetProps
 */
interface IntercomWidgetProps {
  /** The unique identifier for your Intercom app. */
  appId: string;
}

declare global {
  interface Window {
    /** Global Intercom settings object. */
    intercomSettings: IntercomSettings;
    /** Global Intercom function. */
    Intercom: any;
  }
}

/** The base URL for the Intercom API. */
const INTERCOM_API_BASE = "https://api-iam.intercom.io";

/**
 * A React component that initializes and manages the Intercom chat widget.
 *
 * @component
 * @param {IntercomWidgetProps} props - The props for the component.
 * @returns {null} This component doesn't render anything visible.
 *
 * @example
 * ```tsx
 * <IntercomWidget appId="your-intercom-app-id" />
 * ```
 */
const IntercomWidget: React.FC<IntercomWidgetProps> = ({ appId }) => {
  useEffect(() => {
    if (!appId) {
      console.error(
        "Intercom app ID is not provided. Please check the appId prop.",
      );
      return;
    }

    /** The URL of the Intercom widget script. */
    const INTERCOM_SCRIPT_SRC = `https://widget.intercom.io/widget/${appId}`;

    /**
     * Initializes the Intercom chat widget.
     *
     * This function sets up the Intercom settings and either reattaches
     * an existing Intercom instance or loads the Intercom script if it
     * hasn't been loaded yet.
     */
    const initializeIntercom = () => {
      window.intercomSettings = {
        api_base: INTERCOM_API_BASE,
        app_id: appId,
      };

      if (window.Intercom) {
        window.Intercom("reattach_activator");
        window.Intercom("update", window.intercomSettings);
      } else {
        loadIntercomScript();
      }
    };

    /**
     * Loads the Intercom script dynamically.
     *
     * This function creates a script element, sets its source to the
     * Intercom widget URL, and appends it to the document body.
     */
    const loadIntercomScript = () => {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = INTERCOM_SCRIPT_SRC;
      script.onload = () => window.Intercom("update", window.intercomSettings);
      document.body.appendChild(script);
    };

    initializeIntercom();

    return () => {
      // Clean up Intercom on component unmount
      if (window.Intercom) {
        window.Intercom("shutdown");
      }
    };
  }, [appId]);

  return null;
};

export default IntercomWidget;
