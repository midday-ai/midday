"use client";

import React, { useEffect } from "react";

const IntercomClientComponent: React.FC = () => {
  useEffect(() => {
    if (typeof process.env.NEXT_PUBLIC_INTERCOM_APP_ID === "string") {
      window.intercomSettings = {
        api_base: "https://api-iam.intercom.io",
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
      };
    } else {
      console.error(
        "Intercom app ID is not set. Please check your environment variables.",
      );
    }

    if (window.Intercom) {
      window.Intercom("reattach_activator");
      window.Intercom("update", window.intercomSettings);
    } else {
      const intercomScript = document.createElement("script");
      intercomScript.type = "text/javascript";
      intercomScript.async = true;
      intercomScript.src = "https://widget.intercom.io/widget/rxehm4ny";
      intercomScript.onload = () =>
        window.Intercom("update", window.intercomSettings);
      document.body.appendChild(intercomScript);
    }
  }, []); // No dependencies, this effect runs only once.

  return null; // This component does not render anything.
};

export default IntercomClientComponent;
