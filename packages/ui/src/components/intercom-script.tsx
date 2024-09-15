import Script from "next/script";
import React from "react";

/**
 * Props for the IntercomScript component.
 * @interface IntercomScriptProps
 */
interface IntercomScriptProps {
  /** The unique identifier for your Intercom app. */
  appId: string;
}

/**
 * A component that initializes Intercom settings using Next.js Script component.
 *
 * This component should be placed in your layout file or any other file that's
 * rendered on every page where you want Intercom to be available.
 *
 * @component
 * @param {IntercomScriptProps} props - The props for the component.
 * @returns {JSX.Element} A Next.js Script component that initializes Intercom.
 *
 * @example
 * ```tsx
 * import { IntercomScript } from '@/lib/IntercomScript';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <IntercomScript appId="your-intercom-app-id" />
 *     </>
 *   );
 * }
 * ```
 */
export const IntercomScript: React.FC<IntercomScriptProps> = ({ appId }) => (
  <Script
    strategy="afterInteractive"
    id="intercom-settings"
    dangerouslySetInnerHTML={{
      __html: `
        window.intercomSettings = {
          api_base: "https://api-iam.intercom.io",
          app_id: "${appId}",
        };
      `,
    }}
  />
);
