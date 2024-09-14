// AllInOneWidget.tsx
"use client";

import React, { useEffect } from "react";
import Script from "next/script";

export interface AllInOneWidgetProps {
  organization: string;
  placement?: "left" | "right";
  fullScreen?: boolean;
  initialPage?:
    | "MainView"
    | "RoadmapView"
    | "CreatePost"
    | "PostsView"
    | "ChangelogView";
  metadata?: Record<string, any> | null;
}

const AllInOneWidget: React.FC<AllInOneWidgetProps> = ({
  organization,
  placement = "right",
  fullScreen = false,
  initialPage = "MainView",
  metadata = null,
}) => {
  useEffect(() => {
    const win = window as any;

    if (typeof win.Featurebase !== "function") {
      win.Featurebase = function () {
        (win.Featurebase.q = win.Featurebase.q || []).push(arguments);
      };
    }

    win.Featurebase("initialize_portal_widget", {
      organization,
      placement,
      fullScreen,
      initialPage,
      metadata,
    });
  }, [organization, placement, fullScreen, initialPage, metadata]);

  return (
    <Script src="https://do.featurebase.app/js/sdk.js" id="featurebase-sdk" />
  );
};

export default AllInOneWidget;
