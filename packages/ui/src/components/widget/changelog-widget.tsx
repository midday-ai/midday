"use client";

// NextJS 13 requires this. Remove if you are using NextJS 12 or lower
import { useEffect } from "react";
import Script from "next/script";
import * as React from "react";

const ChangelogWidget = () => {
  useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase("initialize_changelog_widget", {
      organization: "solomonai", // Replace this with your featurebase organization name
      placement: "right", // Choose between right, left, top, bottom placement (Optional if fullscreenPopup is enabled)
      theme: "light", // Choose between dark or light theme
      fullscreenPopup: true, // Optional - Open a fullscreen announcement of the new feature to the user
      usersName: "John", // Optional - Show the users name in the welcome message for the fullscreen popup
    });
  }, []);

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      <div>
        <button data-featurebase-changelog>
          Open changelog <span id="fb-update-badge"></span>
        </button>
      </div>
    </>
  );
};

export default ChangelogWidget;
