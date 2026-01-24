"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CursorMcpLogo,
  DeelLogo,
  DropboxLogo,
  EInvoiceLogo,
  FortnoxLogo,
  GmailLogo,
  GoogleDriveLogo,
  OutlookLogo,
  PolarLogo,
  QuickBooksLogo,
  RaycastLogo,
  RaycastMcpLogo,
  SlackLogo,
  StripeLogo,
  StripePaymentsLogo,
  WhatsAppLogo,
  XeroLogo,
} from "@midday/app-store/logos";
import { cn } from "@midday/ui/cn";

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
  "google-drive": GoogleDriveLogo,
  dropbox: DropboxLogo,
  polar: PolarLogo,
  deel: DeelLogo,
  "e-invoice": EInvoiceLogo,
  "cursor-mcp": CursorMcpLogo,
  "claude-mcp": ClaudeMcpLogo,
  "raycast-mcp": RaycastMcpLogo,
  "chatgpt-mcp": ChatGPTMcpLogo,
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
    <div
      className={cn(
        "w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>img]:w-full [&>img]:h-full [&>img]:object-contain",
        className,
      )}
    >
      <Logo />
    </div>
  );
}
