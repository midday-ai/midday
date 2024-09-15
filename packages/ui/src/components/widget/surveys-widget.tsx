"use client";

// NextJS 13 requires this. Remove if you are using NextJS 12 or lower
import Script from "next/script";
import * as React from "react";
import { useEffect } from "react";

const SurveyWidget = () => {
  useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        // eslint-disable-next-line prefer-rest-params
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }
    win.Featurebase(
      "initialize_survey_widget",
      {
        organization: "solomonai", // required
        placement: "bottom-right", // optional (bottom-right or bottom-left)
        theme: "light", // optional (light or dark)
        email: "youruser@example.com", // optional
        // jwtToken: "token", // optional - add additional user data
      },
      (err: any) => {
        // Callback function. Called when identify completed.
        if (err) {
          // console.error(err);
        } else {
          // console.log("Data sent successfully!");
        }
      },
    );
  }, []);

  return (
    <>
      <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
    </>
  );
};

export default SurveyWidget;
