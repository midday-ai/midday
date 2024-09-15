"use client";

// NextJS 13 requires this. Remove if you are using NextJS 12 or lower
import { useEffect } from "react";
import Script from "next/script";
import * as React from "react";

const FeatureBaseWidget = () => {
  useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase("embed", {
      /* Required */
      organization: "solomonai",

      /* Optional */
      basePath: null, // Sync urls between your website & our embed. Example: '/feedback'. Refer to the url synchronizing section below to learn more.

      // Aesthetic or Display
      theme: "light", // options: light [default], dark. Remove for auto.
      initialPage: "Board", // options: Board [default], Changelog, Roadmap
      hideMenu: false, // Hides the top navigation bar
      hideLogo: false, // Hides the logo in the top navigation bar & leaves the Sign In button visible.

      filters: null, // Default filters to apply to the board view. Copy the filters from the URL when you have the filters you want selected. Example: 'b=63f827df2d62cb301468aac4&sortBy=upvotes:desc'
      jwtToken: null, // Automatically sign in a user with a JWT token. See the JWT section below.
      metadata: null, // Attach session-specific metadata to feedback. Refer to the advanced section for the details: https://developers.featurebase.app/install/advanced#metadata
    });
  }, []);

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
      <div data-featurebase-embed></div>
    </>
  );
};

export default FeatureBaseWidget;
