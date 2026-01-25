"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  CursorMcpLogo,
  DropboxLogo,
  EInvoiceLogo,
  FortnoxLogo,
  GmailLogo,
  GoogleDriveLogo,
  OutlookLogo,
  QuickBooksLogo,
  RaycastMcpLogo,
  StripeLogo,
  StripePaymentsLogo,
  WhatsAppLogo,
  XeroLogo,
} from "@midday/app-store/logos";
import { cn } from "@midday/ui/cn";

const logoMap: Record<string, React.ComponentType> = {
  gmail: GmailLogo,
  outlook: OutlookLogo,
  whatsapp: WhatsAppLogo,
  xero: XeroLogo,
  quickbooks: QuickBooksLogo,
  fortnox: FortnoxLogo,
  "stripe-payments": StripePaymentsLogo,
  stripe: StripeLogo,
  "google-drive": GoogleDriveLogo,
  dropbox: DropboxLogo,
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
