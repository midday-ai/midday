import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions",
};

export default function Page() {
  return (
    <>
      <div className="max-w-[600px] m-auto my-20">
        <h1 className="scroll-m-20 text-2xl tracking-tight lg:text-3xl">
          Terms and Conditions
        </h1>

        <div className="text-component line-height-lg v-space-md">
          <p className="leading-7 mt-8">Last updated: October 26, 2023</p>

          <p className="leading-7 mt-8">
            These Terms and Conditions ("Terms", "Terms and Conditions") govern
            your relationship with the Midday application (the "Service")
            operated by Midday Labs AB ("us", "we", or "our").
          </p>

          <p className="leading-7 mt-8">
            Please read these Terms and Conditions carefully before using our
            Service.
          </p>

          <p className="leading-7 mt-8">
            By accessing or using the Service, you agree to be bound by these
            Terms. If you disagree with any part of the Terms, you may not
            access the Service.
          </p>

          <h2>1. Subscriptions</h2>

          <p className="leading-7 mt-8">
            Some parts of the Service are billed on a subscription basis
            ("Subscription(s)"). You will be billed in advance on a recurring
            and periodic basis ("Billing Cycle"). Billing cycles are set on a
            monthly basis.
          </p>

          <p className="leading-7 mt-8">
            At the end of each Billing Cycle, your Subscription will
            automatically renew under the same conditions unless you cancel it
            or Midday Labs AB cancels it. You may cancel your Subscription
            through your online account management page or by contacting Midday
            Labs AB's customer support.
          </p>

          <p className="leading-7 mt-8">
            A valid payment method, including a credit card, is required. You
            must provide accurate and complete billing information. By
            submitting payment information, you authorize us to charge
            Subscription fees to your chosen payment method.
          </p>

          <p className="leading-7 mt-8">
            If automatic billing fails, Midday Labs AB will issue an invoice and
            require manual payment within a stated deadline.
          </p>

          <h2>2. Fee Changes</h2>

          <p className="leading-7 mt-8">
            Midday Labs AB may modify Subscription fees at its sole discretion.
            Any changes will take effect at the end of the current Billing
            Cycle.
          </p>

          <p className="leading-7 mt-8">
            We will provide reasonable prior notice of any changes. Continued
            use of the Service after fee changes take effect constitutes your
            agreement to the new fees.
          </p>

          <h2>3. Refunds</h2>

          <p className="leading-7 mt-8">
            Refund requests may be considered on a case-by-case basis and are
            granted at the sole discretion of Midday Labs AB.
          </p>

          <h2>4. Content</h2>

          <p className="leading-7 mt-8">
            Our Service may allow you to post, link, store, share, and otherwise
            make available various information ("Content"). You are responsible
            for the legality, reliability, and appropriateness of any Content
            you post.
          </p>

          <p className="leading-7 mt-8">
            By posting Content, you grant us a license to use, modify, display,
            reproduce, and distribute it on the Service. You retain ownership of
            your Content and are responsible for protecting your rights.
          </p>

          <p className="leading-7 mt-8">You warrant that:</p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">
              You own or have rights to the Content,
            </li>
            <li className="leading-7">
              Posting the Content does not violate any rights of others.
            </li>
          </ul>

          <p className="leading-7 mt-8">
            Midday Labs AB does not verify the accuracy or suitability of any
            financial or tax-related Content shared through the Service. Use of
            such Content is at your own risk.
          </p>

          <h2>5. Accounts</h2>

          <p className="leading-7 mt-8">
            When you create an account, you must provide accurate, complete, and
            current information. Failure to do so constitutes a breach of these
            Terms.
          </p>

          <p className="leading-7 mt-8">
            You are responsible for safeguarding your password and all activity
            under your account. You agree not to disclose your password to any
            third party and to notify us of any unauthorized use.
          </p>

          <p className="leading-7 mt-8">You may not use a username that:</p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">
              Belongs to someone else without authorization,
            </li>
            <li className="leading-7">Is not lawfully available,</li>
            <li className="leading-7">Is offensive, vulgar, or obscene.</li>
          </ul>

          <h2>6. Financial and Tax Disclaimer</h2>

          <p className="leading-7 mt-8">
            Midday Labs AB is not a financial advisor, accountant, or tax
            consultant. All content and functionality within the Service are
            provided for general informational purposes only and do not
            constitute financial, legal, or tax advice.
          </p>

          <p className="leading-7 mt-8">
            You are solely responsible for complying with all applicable
            financial and tax regulations, including local reporting
            obligations. We strongly recommend verifying all decisions and data
            with your local tax authority or a qualified professional.
          </p>

          <p className="leading-7 mt-8">
            Midday Labs AB accepts no liability for any consequences, losses, or
            penalties resulting from your use of the Service for financial or
            tax purposes.
          </p>

          <h2>7. Reliance on External Services and User-Generated Data</h2>

          <p className="leading-7 mt-8">
            Midday Labs AB relies on third-party services (e.g., banking APIs,
            payment providers, and financial aggregators) to provide
            transactional data and related functionality. Additionally, the
            Service may involve manually inputted or user-generated data.
          </p>

          <p className="leading-7 mt-8">You acknowledge and agree that:</p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">
              All financial and transactional data—whether sourced externally or
              entered by users—is displayed "as is", without verification or
              warranty;
            </li>
            <li className="leading-7">
              Midday Labs AB cannot guarantee the completeness, accuracy,
              timeliness, or reliability of such data;
            </li>
            <li className="leading-7">
              You are solely responsible for verifying all information before
              using it for decisions or reporting;
            </li>
            <li className="leading-7">
              Midday Labs AB shall not be liable for any loss, damage, or
              liability arising from the use of such data, including errors,
              omissions, delays, misinterpretations, or disruptions;
            </li>
            <li className="leading-7">
              Your reliance on third-party data or user-submitted content is
              entirely at your own risk.
            </li>
          </ul>

          <h2>8. Copyright Policy</h2>

          <p className="leading-7 mt-8">
            We respect intellectual property rights and respond to claims of
            copyright or other IP infringement.
          </p>

          <p className="leading-7 mt-8">
            If you believe your work has been used in a way that constitutes
            infringement, please email dmca@midday.ai with:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">
              A detailed description of the material,
            </li>
            <li className="leading-7">
              Identification of the copyrighted work,
            </li>
            <li className="leading-7">Your contact details,</li>
            <li className="leading-7">
              A good-faith statement of unauthorized use.
            </li>
          </ul>

          <p className="leading-7 mt-8">
            False claims may result in legal liability, including damages and
            attorney's fees.
          </p>

          <h2>9. Intellectual Property</h2>

          <p className="leading-7 mt-8">
            The Service and its original content (excluding Content provided by
            users), features, and functionality are and remain the property of
            Midday Labs AB and its licensors.
          </p>

          <p className="leading-7 mt-8">
            Our trademarks and trade dress may not be used without prior written
            permission.
          </p>

          <h2>10. Links to Other Websites</h2>

          <p className="leading-7 mt-8">
            The Service may contain links to third-party websites or services
            that are not controlled by Midday Labs AB.
          </p>

          <p className="leading-7 mt-8">
            We assume no responsibility for third-party content, privacy
            policies, or practices. You agree that Midday Labs AB shall not be
            liable for any loss or damage caused by use of such content or
            services.
          </p>

          <p className="leading-7 mt-8">
            Please review the terms and policies of any third-party websites you
            visit.
          </p>

          <h2>11. Termination</h2>

          <p className="leading-7 mt-8">
            We may terminate or suspend your account without prior notice for
            any reason, including violation of these Terms.
          </p>

          <p className="leading-7 mt-8">
            Upon termination, your right to use the Service will cease
            immediately. You may also terminate your account at any time by
            discontinuing use of the Service.
          </p>

          <h2>12. Limitation of Liability</h2>

          <p className="leading-7 mt-8">
            Midday Labs AB and its affiliates, directors, employees, and
            suppliers shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including:
          </p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">Loss of profits, data, or goodwill,</li>
            <li className="leading-7">Errors or delays in third-party data,</li>
            <li className="leading-7">
              Unauthorized access or use of your Content,
            </li>
            <li className="leading-7">Any use of the Service.</li>
          </ul>

          <p className="leading-7 mt-8">
            This limitation applies even if a remedy fails of its essential
            purpose.
          </p>

          <h2>13. Disclaimer</h2>

          <p className="leading-7 mt-8">
            You use the Service at your own risk. The Service is provided on an
            "AS IS" and "AS AVAILABLE" basis, without warranties of any kind.
          </p>

          <p className="leading-7 mt-8">We do not warrant that:</p>
          <ul className="list-disc pl-6 mt-4">
            <li className="leading-7">
              The Service will be secure, timely, or error-free,
            </li>
            <li className="leading-7">Any defects will be corrected,</li>
            <li className="leading-7">
              The Service is free of viruses or harmful components,
            </li>
            <li className="leading-7">
              The results will meet your requirements,
            </li>
            <li className="leading-7">
              Third-party data or integrations will be reliable.
            </li>
          </ul>

          <h2>14. Governing Law</h2>

          <p className="leading-7 mt-8">
            These Terms are governed by the laws of Sweden, without regard to
            its conflict of law rules.
          </p>

          <p className="leading-7 mt-8">
            Failure to enforce any part of the Terms does not waive our rights.
            If any provision is found to be invalid, the remainder remains in
            effect.
          </p>

          <p className="leading-7 mt-8">
            These Terms constitute the entire agreement between you and Midday
            Labs AB regarding the Service.
          </p>

          <h2>15. Changes</h2>

          <p className="leading-7 mt-8">
            We reserve the right to modify or replace these Terms at any time.
            Material changes will be announced at least 30 days before they take
            effect.
          </p>

          <p className="leading-7 mt-8">
            By continuing to use the Service after changes are effective, you
            agree to be bound by the new terms. If you do not agree, please stop
            using the Service.
          </p>

          <h2>16. Contact Us</h2>

          <p className="leading-7 mt-8">
            For questions regarding these Terms, contact:
          </p>

          <p className="leading-7 mt-8">support@midday.ai</p>
        </div>
      </div>
    </>
  );
}
