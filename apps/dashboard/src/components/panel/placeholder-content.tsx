import { Card, CardContent } from "@midday/ui/card";
import Image from "next/image";
import Link from "next/link";
import React from "react";

/**
 * PlaceholderContent component that displays a placeholder card with attribution.
 * This component is useful for pages or sections that are under development or need temporary content.
 *
 * @returns {React.ReactElement} The rendered PlaceholderContent component
 */
const PlaceholderContent: React.FC = () => {
  return (
    <Card className="mt-6 rounded-lg border-none">
      <CardContent className="p-6">
        <div className="flex min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)] items-center justify-center">
          <div className="relative flex flex-col">
            {/* Placeholder for potential image or content */}
            <AttributionLink />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * AttributionLink component that renders the attribution link for the design.
 *
 * @returns {React.ReactElement} The rendered AttributionLink component
 */
const AttributionLink: React.FC = () => (
  <div className="absolute -bottom-8 right-0">
    <Link
      href="https://www.freepik.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-muted-foreground hover:underline"
    >
      Designed by Freepik
    </Link>
  </div>
);

PlaceholderContent.displayName = "PlaceholderContent";
AttributionLink.displayName = "AttributionLink";

export default React.memo(PlaceholderContent);
