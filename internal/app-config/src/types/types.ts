import { Metadata } from "next";

type NavItem = {
  title: string;
  href: string;
  showOnAuth?: boolean;
};

type Links = {
  twitter: string;
  github: string;
  docs: string;
  youtube: string;
};

type Payments = {
  subscriptionLink: string;
};

type Billings = {
  customerBillingPortalLink: string;
};

type TwitterMetadata = {
  title: string;
  description: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
};

type OpenGraphMetadata = TwitterMetadata & {
  url: string;
  siteName: string;
  locale: string;
  type: string;
};

type SiteMetadata = Omit<Metadata, "twitter" | "openGraph"> & {
  metadataBase: URL;
  twitter: TwitterMetadata;
  openGraph: OpenGraphMetadata;
};

type Viewport = {
  width: string;
  initialScale: number;
  maximumScale: number;
  userScalable: boolean;
  themeColor: Array<{
    media: string;
  }>;
};

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isMostPopular: boolean;
}

interface FinancialEngineConfig {
  baseUrlProd: string;
  baseUrlDev: string;
  bearerToken: string;
}

type SiteConfig = {
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
  metadata: Metadata;
  viewport: Viewport;
  pricing: PricingPlan[];
  financialEngine: FinancialEngineConfig;
};

export type {
  Billings,
  Links,
  NavItem,
  OpenGraphMetadata,
  Payments,
  PricingPlan,
  SiteConfig,
  SiteMetadata,
  TwitterMetadata,
  Viewport,
};
