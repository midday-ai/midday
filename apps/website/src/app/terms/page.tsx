import type { Metadata } from "next";
import { baseUrl } from "@/app/sitemap";

const title = "Terms and Conditions";
const description =
  "Terms and Conditions for using Midday. Read about your rights and responsibilities when using our service.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: `${baseUrl}/terms`,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-12 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
        <div className="pt-12 sm:pt-16 lg:pt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-3xl xl:text-3xl 2xl:text-3xl 3xl:text-4xl leading-tight lg:leading-tight xl:leading-[1.3] text-foreground">
                  Terms and Conditions
                </h1>
                <p className="font-sans text-sm text-muted-foreground">
                  Last updated: October 26, 2023
                </p>
              </div>

              <div className="prose prose-sm sm:prose-base max-w-none space-y-6 font-sans text-foreground">
                <p className="text-muted-foreground leading-relaxed">
                  These Terms and Conditions ("Terms", "Terms and Conditions")
                  govern your relationship with the Midday application (the
                  "Service") operated by Midday Labs AB ("us", "we", or "our").
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  Please read these Terms and Conditions carefully before using
                  our Service.
                </p>

                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using the Service, you agree to be bound by
                  these Terms. If you disagree with any part of the Terms, you
                  may not access the Service.
                </p>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    1. Subscriptions
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Some parts of the Service are billed on a subscription basis
                    ("Subscription(s)"). You will be billed in advance on a
                    recurring and periodic basis ("Billing Cycle"). Billing
                    cycles are set on a monthly basis.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    At the end of each Billing Cycle, your Subscription will
                    automatically renew under the same conditions unless you
                    cancel it or Midday Labs AB cancels it. You may cancel your
                    Subscription through your online account management page or
                    by contacting Midday Labs AB's customer support.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    A valid payment method, including a credit card, is
                    required. You must provide accurate and complete billing
                    information. By submitting payment information, you
                    authorize us to charge Subscription fees to your chosen
                    payment method.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If automatic billing fails, Midday Labs AB will issue an
                    invoice and require manual payment within a stated deadline.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    2. Fee Changes
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB may modify Subscription fees at its sole
                    discretion. Any changes will take effect at the end of the
                    current Billing Cycle.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We will provide reasonable prior notice of any changes.
                    Continued use of the Service after fee changes take effect
                    constitutes your agreement to the new fees.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    3. Refunds
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Refund requests may be considered on a case-by-case basis
                    and are granted at the sole discretion of Midday Labs AB.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    4. Content
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our Service may allow you to post, link, store, share, and
                    otherwise make available various information ("Content").
                    You are responsible for the legality, reliability, and
                    appropriateness of any Content you post.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By posting Content, you grant us a license to use, modify,
                    display, reproduce, and distribute it on the Service. You
                    retain ownership of your Content and are responsible for
                    protecting your rights.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You warrant that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>You own or have rights to the Content,</li>
                    <li>
                      Posting the Content does not violate any rights of others.
                    </li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB does not verify the accuracy or suitability
                    of any financial or tax-related Content shared through the
                    Service. Use of such Content is at your own risk.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    5. Accounts
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    When you create an account, you must provide accurate,
                    complete, and current information. Failure to do so
                    constitutes a breach of these Terms.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You are responsible for safeguarding your password and all
                    activity under your account. You agree not to disclose your
                    password to any third party and to notify us of any
                    unauthorized use.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You may not use a username that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Belongs to someone else without authorization,</li>
                    <li>Is not lawfully available,</li>
                    <li>Is offensive, vulgar, or obscene.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    6. Financial and Tax Disclaimer
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB is not a financial advisor, accountant, or
                    tax consultant. All content and functionality within the
                    Service are provided for general informational purposes only
                    and do not constitute financial, legal, or tax advice.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You are solely responsible for complying with all applicable
                    financial and tax regulations, including local reporting
                    obligations. We strongly recommend verifying all decisions
                    and data with your local tax authority or a qualified
                    professional.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB accepts no liability for any consequences,
                    losses, or penalties resulting from your use of the Service
                    for financial or tax purposes.
                  </p>

                  <h3 className="font-sans text-sm text-foreground mt-6 mb-3">
                    6.1 Invoices and Payments
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service may allow you to create, send, and manage
                    invoices and to enable payment through third-party payment
                    providers. Midday Labs AB does not verify the legal, tax, or
                    regulatory correctness of any invoice or payment request.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You acknowledge and agree that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      You are solely responsible for the accuracy, legality, and
                      compliance of all invoices you create or send using the
                      Service;
                    </li>
                    <li>
                      You are responsible for ensuring invoices meet all
                      applicable legal, tax, and accounting requirements in your
                      jurisdiction;
                    </li>
                    <li>
                      Midday Labs AB is not responsible for payment disputes,
                      failed payments, chargebacks, or customer disagreements;
                    </li>
                    <li>
                      Use of third-party payment providers is subject to their
                      own terms and policies, and Midday Labs AB assumes no
                      liability for their actions or availability.
                    </li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    7. Reliance on External Services and User-Generated Data
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB relies on third-party services (e.g., banking
                    APIs, payment providers, and financial aggregators) to
                    provide transactional data and related functionality.
                    Additionally, the Service may involve manually inputted or
                    user-generated data.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You acknowledge and agree that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      All financial and transactional data—whether sourced
                      externally or entered by users—is displayed "as is",
                      without verification or warranty;
                    </li>
                    <li>
                      Midday Labs AB cannot guarantee the completeness,
                      accuracy, timeliness, or reliability of such data;
                    </li>
                    <li>
                      You are solely responsible for verifying all information
                      before using it for decisions or reporting;
                    </li>
                    <li>
                      Midday Labs AB shall not be liable for any loss, damage,
                      or liability arising from the use of such data, including
                      errors, omissions, delays, misinterpretations, or
                      disruptions;
                    </li>
                    <li>
                      Your reliance on third-party data or user-submitted
                      content is entirely at your own risk.
                    </li>
                  </ul>

                  <h3 className="font-sans text-sm text-foreground mt-6 mb-3">
                    7.1 Accounting and ERP Integrations
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service may allow you to export financial data,
                    transactions, attachments, and related information to
                    third-party accounting or ERP systems, including but not
                    limited to Fortnox, Xero, and QuickBooks.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    You acknowledge and agree that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>
                      Midday Labs AB acts solely as a technical facilitator of
                      data transfer and does not control, verify, or validate
                      how third-party accounting systems process, interpret, or
                      apply exported data;
                    </li>
                    <li>
                      You are solely responsible for reviewing, approving, and
                      verifying all exported data before it is used for
                      bookkeeping, reporting, tax filings, or compliance
                      purposes;
                    </li>
                    <li>
                      Midday Labs AB is not responsible for errors, omissions,
                      misclassifications, tax treatments, or reporting outcomes
                      resulting from exported data or third-party system
                      behavior;
                    </li>
                    <li>
                      Any reliance on accounting or ERP integrations is at your
                      own risk.
                    </li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    8. Copyright Policy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We respect intellectual property rights and respond to
                    claims of copyright or other IP infringement.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If you believe your work has been used in a way that
                    constitutes infringement, please email dmca@midday.ai with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>A detailed description of the material,</li>
                    <li>Identification of the copyrighted work,</li>
                    <li>Your contact details,</li>
                    <li>A good-faith statement of unauthorized use.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    False claims may result in legal liability, including
                    damages and attorney's fees.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    9. Intellectual Property
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service and its original content (excluding Content
                    provided by users), features, and functionality are and
                    remain the property of Midday Labs AB and its licensors.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Our trademarks and trade dress may not be used without prior
                    written permission.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    10. Links to Other Websites
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service may contain links to third-party websites or
                    services that are not controlled by Midday Labs AB.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We assume no responsibility for third-party content, privacy
                    policies, or practices. You agree that Midday Labs AB shall
                    not be liable for any loss or damage caused by use of such
                    content or services.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Please review the terms and policies of any third-party
                    websites you visit.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    11. Termination
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We may terminate or suspend your account without prior
                    notice for any reason, including violation of these Terms.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Upon termination, your right to use the Service will cease
                    immediately. You may also terminate your account at any time
                    by discontinuing use of the Service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    12. Limitation of Liability
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Midday Labs AB and its affiliates, directors, employees, and
                    suppliers shall not be liable for any indirect, incidental,
                    special, consequential, or punitive damages, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Loss of profits, data, or goodwill,</li>
                    <li>Errors or delays in third-party data,</li>
                    <li>Unauthorized access or use of your Content,</li>
                    <li>Any use of the Service.</li>
                  </ul>
                  <p className="text-muted-foreground leading-relaxed">
                    This limitation applies even if a remedy fails of its
                    essential purpose.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    13. Disclaimer
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You use the Service at your own risk. The Service is
                    provided on an "AS IS" and "AS AVAILABLE" basis, without
                    warranties of any kind.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not warrant that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>The Service will be secure, timely, or error-free,</li>
                    <li>Any defects will be corrected,</li>
                    <li>
                      The Service is free of viruses or harmful components,
                    </li>
                    <li>The results will meet your requirements,</li>
                    <li>Third-party data or integrations will be reliable.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    14. Governing Law
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms are governed by the laws of Sweden, without
                    regard to its conflict of law rules.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Failure to enforce any part of the Terms does not waive our
                    rights. If any provision is found to be invalid, the
                    remainder remains in effect.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    These Terms constitute the entire agreement between you and
                    Midday Labs AB regarding the Service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    15. Changes
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify or replace these Terms at any
                    time. Material changes will be announced at least 30 days
                    before they take effect.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    By continuing to use the Service after changes are
                    effective, you agree to be bound by the new terms. If you do
                    not agree, please stop using the Service.
                  </p>
                </section>

                <section className="space-y-4">
                  <h2 className="font-sans text-base text-foreground mt-8 mb-4">
                    16. Contact Us
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For questions regarding these Terms, contact:
                  </p>
                  <p className="text-foreground leading-relaxed">
                    <a
                      href="mailto:support@midday.ai"
                      className="text-foreground hover:text-muted-foreground transition-colors"
                    >
                      support@midday.ai
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
