import { SiteConfig } from "@/types/index";

const sharedTitle = "Solomon AI | Your Personal Financial Assistant";
const sharedDescription =
  "Simplify Your Finances, Make Smarter Decisions, and Achieve Your Financial Goals with AI-Powered Insights.";
const sharedImages = [
  { url: "", width: 800, height: 600 },
  { url: "", width: 1800, height: 1600 },
];

const sharedMetadata = {
  title: sharedTitle,
  description: sharedDescription,
  images: sharedImages,
};

const pricingPlans = [
  {
    id: "price_1",
    name: "Basic",
    description: "A basic plan for startups and individual users",
    features: [
      "AI-powered analytics",
      "Basic support",
      "5 projects limit",
      "Access to basic AI tools",
    ],
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    isMostPopular: false,
  },
  {
    id: "price_2",
    name: "Premium",
    description: "A premium plan for growing businesses",
    features: [
      "Advanced AI insights",
      "Priority support",
      "Unlimited projects",
      "Access to all AI tools",
      "Custom integrations",
    ],
    monthlyPrice: 2000,
    yearlyPrice: 20000,
    isMostPopular: true,
  },
  {
    id: "price_5",
    name: "Enterprise",
    description:
      "An enterprise plan with advanced features for large organizations",
    features: [
      "Custom AI solutions",
      "24/7 dedicated support",
      "Unlimited projects",
      "Access to all AI tools",
      "Custom integrations",
      "Data security and compliance",
    ],
    monthlyPrice: 5000,
    yearlyPrice: 50000,
    isMostPopular: false,
  },
  {
    id: "price_6",
    name: "Ultimate",
    description: "The ultimate plan with all features for industry leaders",
    features: [
      "Bespoke AI development",
      "White-glove support",
      "Unlimited projects",
      "Priority access to new AI tools",
      "Custom integrations",
      "Highest data security and compliance",
    ],
    monthlyPrice: 8000,
    yearlyPrice: 80000,
    isMostPopular: false,
  },
];

export const BusinessConfig: SiteConfig = {
  platformHost: "app-consumer.solomon-ai.app",
  company: "Solomon AI",
  name: "Solomon AI | Personal Finance",
  email: { from: "Solomon AI <founders@inbox.solomon-ai.app>" },
  title: sharedTitle,
  description: sharedDescription,
  platformUrl: "https://app-consumer.solomon-ai.app",
  webUrl: "https://solomon-ai.app",
  desktopUrl: "solomonai://",
  dubProjectSlug: "solomon-ai",
  mfaIssuer: "app-consumer.solomon-ai.app",
  uptimeUrl: "https://solomon-ai.betteruptime.com/",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Register", href: "/register", showOnAuth: false },
    { title: "Login", href: "/login", showOnAuth: false },
  ],
  links: {
    twitter: "https://twitter.com/shadcn",
    github: "https://github.com/shadcn/ui",
    docs: "https://ui.shadcn.com",
    youtube: "https://www.youtube.com/channel/UCF-lb8m7lniPSKJ4C6F4DDA",
  },
  supportEmail: "yoanyomba@solomon-ai.co",
  helpUrl: "https:/solomon-ai.io",
  intercomAppId: "pezs7zbq",
  payments: {
    subscriptionLink:
      process.env.NODE_ENV === "development"
        ? "https://buy.stripe.com/test_00gg1O1zNgtffNSeUV"
        : "https://buy.stripe.com/9AQdSf6iPdcdggM000",
  },
  billings: {
    customerBillingPortalLink:
      process.env.NODE_ENV === "development"
        ? "https://billing.stripe.com/p/login/test_3csdSC6UVbWecsUfYY"
        : "https://billing.stripe.com/p/login/8wM9Btf6j8Gf8Q8000",
  },
  metadata: {
    metadataBase: new URL("https://app-consumer.solomon-ai.app"),
    ...sharedMetadata,
    twitter: sharedMetadata,
    openGraph: {
      ...sharedMetadata,
      url: "https://app-consumer.solomon-ai.app",
      siteName: "Solomon AI",
      locale: "en_US",
      type: "website",
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
      { media: "(prefers-color-scheme: light)" },
      { media: "(prefers-color-scheme: dark)" },
    ],
  },
  pricing: pricingPlans,
  financialEngine: {
    baseUrlProd: "https://engine.solomon-ai-platform.com",
    baseUrlDev: "https://engine-staging.solomon-ai-platform.com",
    bearerToken: "SOLOMONAI",
  },
};
