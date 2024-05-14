"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";

type Props = {
  calLink: string;
};

export function CalEmbed({ calLink }) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  return (
    <Cal
      calLink={calLink}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view", theme: "dark" }}
    />
  );
}
