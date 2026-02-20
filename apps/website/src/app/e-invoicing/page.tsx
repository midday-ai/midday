import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";
import { EInvoicing } from "@/components/e-invoicing";

const title = "E-Invoicing";
const description =
  "Send and receive compliant e-invoices via the Peppol network in 30+ countries. Built into your invoicing workflow — no extra tools needed.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "e-invoicing",
    "peppol",
    "electronic invoicing",
    "e-invoice software",
    "peppol network",
    "b2b e-invoicing",
    "compliant invoicing",
    "invoicing software",
    "best invoice software",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/e-invoicing`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/e-invoicing`,
  },
};

const faqs = [
  {
    question: "What is e-invoicing?",
    answer:
      "E-invoicing is the exchange of invoice documents between businesses in a structured electronic format. Unlike PDF invoices sent by email, e-invoices are machine-readable, validated against tax rules, and delivered through secure networks — making them faster, more accurate, and increasingly required by law.",
  },
  {
    question: "What is the Peppol network?",
    answer:
      "Peppol is a global standard for electronic document exchange used by businesses and governments in over 30 countries. It provides a secure, standardized way to send and receive invoices between any two registered participants, regardless of what software they use.",
  },
  {
    question: "Which countries support e-invoicing via Peppol?",
    answer:
      "Peppol is widely adopted across Europe — including Belgium, Germany, Norway, Finland, Sweden, Denmark, the Netherlands, and Italy — as well as in Australia, New Zealand, Singapore, Japan, and Malaysia. Any registered Peppol participant can exchange invoices globally.",
  },
  {
    question: "How long does Peppol registration take?",
    answer:
      "Registration typically takes up to 72 hours. It includes an identity verification step to ensure your business is legitimate on the Peppol network. Once registered, you can send and receive e-invoices immediately.",
  },
  {
    question: "Do my customers need to be on the Peppol network?",
    answer:
      "To receive an e-invoice via Peppol, your customer needs a Peppol participant ID. If they don't have one, Midday still sends the invoice by email as usual. When a customer does have a Peppol ID, the e-invoice is delivered automatically alongside the email.",
  },
  {
    question: "What invoice formats are supported?",
    answer:
      "Midday automatically converts your invoices to the Peppol BIS Billing UBL 3.0 format, which is the international standard. You don't need to know or manage any of this — it happens behind the scenes when you send an invoice.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <EInvoicing faqs={faqs} />
    </>
  );
}
