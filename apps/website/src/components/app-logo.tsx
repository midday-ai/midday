"use client";

import {
  ChatGPTMcpLogo,
  ClaudeMcpLogo,
  ClineMcpLogo,
  CopilotMcpLogo,
  CursorMcpLogo,
  DeelLogo,
  DropboxLogo,
  EInvoiceLogo,
  FortnoxLogo,
  GeminiMcpLogo,
  GmailLogo,
  GoogleDriveLogo,
  MakeMcpLogo,
  ManusMcpLogo,
  MiddayDesktopLogo,
  N8nMcpLogo,
  OpenCodeMcpLogo,
  OutlookLogo,
  PerplexityMcpLogo,
  PolarLogo,
  QuickBooksLogo,
  RaycastLogo,
  RaycastMcpLogo,
  SlackLogo,
  StripeLogo,
  StripePaymentsLogo,
  WhatsAppLogo,
  WindsurfMcpLogo,
  XeroLogo,
  ZapierMcpLogo,
  ZedMcpLogo,
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
  "midday-desktop": MiddayDesktopLogo,
  "google-drive": GoogleDriveLogo,
  dropbox: DropboxLogo,
  polar: PolarLogo,
  deel: DeelLogo,
  "e-invoice": EInvoiceLogo,
  "cursor-mcp": CursorMcpLogo,
  "claude-mcp": ClaudeMcpLogo,
  "perplexity-mcp": PerplexityMcpLogo,
  "raycast-mcp": RaycastMcpLogo,
  "chatgpt-mcp": ChatGPTMcpLogo,
  "gemini-mcp": GeminiMcpLogo,
  "opencode-mcp": OpenCodeMcpLogo,
  "zapier-mcp": ZapierMcpLogo,
  "copilot-mcp": CopilotMcpLogo,
  "n8n-mcp": N8nMcpLogo,
  "make-mcp": MakeMcpLogo,
  "windsurf-mcp": WindsurfMcpLogo,
  "cline-mcp": ClineMcpLogo,
  "zed-mcp": ZedMcpLogo,
  "manus-mcp": ManusMcpLogo,
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
