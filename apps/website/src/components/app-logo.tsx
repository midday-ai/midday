"use client";

import {
  DeelLogo,
  DropboxLogo,
  EInvoiceLogo,
  FortnoxLogo,
  GmailLogo,
  GoogleDriveLogo,
  MiddayDesktopLogo,
  OutlookLogo,
  PolarLogo,
  QuickBooksLogo,
  RaycastLogo,
  SlackLogo,
  StripeLogo,
  StripePaymentsLogo,
  WhatsAppLogo,
  XeroLogo,
} from "@midday/app-store/logos";

const logoMap: Record<string, React.ComponentType> = {
  gmail: GmailLogo,
  outlook: OutlookLogo,
  slack: SlackLogo,
  whatsapp: WhatsAppLogo,
  xero: XeroLogo,
  quickbooks: QuickBooksLogo,
  fortnox: FortnoxLogo,
  raycast: RaycastLogo,
  "stripe-payments": StripePaymentsLogo,
  stripe: StripeLogo,
  "midday-desktop": MiddayDesktopLogo,
  "google-drive": GoogleDriveLogo,
  dropbox: DropboxLogo,
  polar: PolarLogo,
  deel: DeelLogo,
  "e-invoice": EInvoiceLogo,
};

interface AppLogoProps {
  appId: string;
  className?: string;
}

export function AppLogo({ appId, className }: AppLogoProps) {
  const Logo = logoMap[appId];

  if (!Logo) {
    return null;
  }

  return (
    <div className={className}>
      <Logo />
    </div>
  );
}
