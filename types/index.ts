export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isMostPopular: boolean;
}

export interface FinancialEngineConfig {
  baseUrlProd: string;
  baseUrlDev: string;
  bearerToken: string;
}

export interface NavItem {
  title: string;
  href: string;
  showOnAuth?: boolean;
}

export interface Links {
  twitter: string;
  github: string;
  docs: string;
  youtube: string;
}

export interface Payments {
  subscriptionLink: string;
}

export interface Billings {
  customerBillingPortalLink: string;
}

export interface Image {
  url: string;
  width: number;
  height: number;
}

export interface SiteMetadata {
  title: string;
  description: string;
  images: Image[]; // Add this line
  metadataBase?: URL;
  twitter?: Partial<SiteMetadata>;
  openGraph?: {
    url: string;
    siteName: string;
    locale: string;
    type: string;
  } & Partial<SiteMetadata>;
}

export interface Viewport {
  width: string;
  initialScale: number;
  maximumScale: number;
  userScalable: boolean;
  themeColor: Array<{
    media: string;
    color: string;
  }>;
}

export interface SiteConfig {
  platformHost: string;
  company: string;
  name: string;
  email: { from: string };
  title: string;
  description: string;
  platformUrl: string;
  webUrl: string;
  desktopUrl: string;
  dubProjectSlug: string;
  mfaIssuer: string;
  uptimeUrl: string;
  mainNav: NavItem[];
  links: Links;
  supportEmail: string;
  helpUrl: string;
  intercomAppId: string;
  payments: Payments;
  billings: Billings;
  metadata: SiteMetadata;
  viewport: Viewport;
  pricing: PricingPlan[];
  financialEngine: FinancialEngineConfig;
}
