import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service",
};

export default function Page() {
  return (
    <main className="mx-auto flex-1 max-w-screen-2xl">
      <div className="container relative mt-4 max-w-[800px] mx-auto">
        <h1 className="scroll-m-20 text-3xl font-bold tracking-tight mb-6">
          Terms of Service
        </h1>

        <div className="space-y-6">
          <section>
            <p className="text-sm text-gray-600">Last updated: [Insert Date]</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              These Terms of Service ("Terms") govern your relationship with the
              Cookbook AI application (the "Service") operated by Cookbook AI
              ("us", "we", or "our"). Please read these Terms carefully before
              using our Cookbook AI application. Your access to and use of the
              Service is conditioned on your acceptance of and compliance with
              these Terms. These Terms apply to all visitors, users, and others
              who access or use the Service. By accessing or using the Service,
              you agree to be bound by these Terms. If you disagree with any
              part of the terms, then you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              2. Token-Based System
            </h2>
            <p>
              Cookbook AI operates on a token-based system. Users can purchase
              tokens to access certain features and services within the
              application. By purchasing tokens, you agree to the following:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Tokens are non-refundable and non-transferable.</li>
              <li>
                Tokens have no cash value and cannot be exchanged for cash.
              </li>
              <li>
                Cookbook AI reserves the right to modify the token system,
                including token prices and the features they unlock, at any
                time.
              </li>
              <li>
                Unused tokens may expire after a certain period, as specified at
                the time of purchase.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Purchases</h2>
            <p>
              When you purchase tokens, you agree to provide accurate and
              complete payment information. You are responsible for all charges
              incurred under your account. Prices for tokens are subject to
              change without notice. By making a purchase, you authorize
              Cookbook AI to charge your chosen payment method for the tokens
              you've selected.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Refunds</h2>
            <p>
              As tokens are digital goods that are immediately delivered and
              consumed, they are generally non-refundable. However, refund
              requests may be considered by Cookbook AI on a case-by-case basis
              and granted in the sole discretion of Cookbook AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Content</h2>
            <p>
              Our Service allows you to post, link, store, share and otherwise
              make available certain information, text, graphics, videos, or
              other material ("Content"). You are responsible for the Content
              that you post to the Service, including its legality, reliability,
              and appropriateness.
            </p>
            <p className="mt-2">
              By posting Content to the Service, you grant us the right and
              license to use, modify, publicly perform, publicly display,
              reproduce, and distribute such Content on and through the Service.
              You retain any and all of your rights to any Content you submit,
              post or display on or through the Service and you are responsible
              for protecting those rights. You agree that this license includes
              the right for us to make your Content available to other users of
              the Service, who may also use your Content subject to these Terms.
            </p>
            <p className="mt-2">
              You represent and warrant that: (i) the Content is yours (you own
              it) or you have the right to use it and grant us the rights and
              license as provided in these Terms, and (ii) the posting of your
              Content on or through the Service does not violate the privacy
              rights, publicity rights, copyrights, contract rights or any other
              rights of any person.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Accounts</h2>
            <p>
              When you create an account with us, you must provide us with
              information that is accurate, complete, and current at all times.
              Failure to do so constitutes a breach of the Terms, which may
              result in immediate termination of your account on our Service.
            </p>
            <p className="mt-2">
              You are responsible for safeguarding the password that you use to
              access the Service and for any activities or actions under your
              password, whether your password is with our Service or a
              third-party service. You agree not to disclose your password to
              any third party. You must notify us immediately upon becoming
              aware of any breach of security or unauthorized use of your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              7. Intellectual Property
            </h2>
            <p>
              The Service and its original content (excluding Content provided
              by users), features and functionality are and will remain the
              exclusive property of Cookbook AI and its licensors. The Service
              is protected by copyright, trademark, and other laws of both the
              United States and foreign countries. Our trademarks and trade
              dress may not be used in connection with any product or service
              without the prior written consent of Cookbook AI.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              8. Links To Other Web Sites
            </h2>
            <p>
              Our Service may contain links to third-party web sites or services
              that are not owned or controlled by Cookbook AI. Cookbook AI has
              no control over, and assumes no responsibility for, the content,
              privacy policies, or practices of any third party web sites or
              services. You further acknowledge and agree that Cookbook AI shall
              not be responsible or liable, directly or indirectly, for any
              damage or loss caused or alleged to be caused by or in connection
              with use of or reliance on any such content, goods or services
              available on or through any such web sites or services. We
              strongly advise you to read the terms and conditions and privacy
              policies of any third-party web sites or services that you visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without
              prior notice or liability, for any reason whatsoever, including
              without limitation if you breach the Terms. Upon termination, your
              right to use the Service will immediately cease. If you wish to
              terminate your account, you may simply discontinue using the
              Service. Any unused tokens at the time of account termination will
              be forfeited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              10. Limitation Of Liability
            </h2>
            <p>
              In no event shall Cookbook AI, nor its directors, employees,
              partners, agents, suppliers, or affiliates, be liable for any
              indirect, incidental, special, consequential or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses, resulting from (i) your
              access to or use of or inability to access or use the Service;
              (ii) any conduct or content of any third party on the Service;
              (iii) any content obtained from the Service; and (iv) unauthorized
              access, use or alteration of your transmissions or content,
              whether based on warranty, contract, tort (including negligence)
              or any other legal theory, whether or not we have been informed of
              the possibility of such damage, and even if a remedy set forth
              herein is found to have failed of its essential purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">11. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is
              provided on an "AS IS" and "AS AVAILABLE" basis. The Service is
              provided without warranties of any kind, whether express or
              implied, including, but not limited to, implied warranties of
              merchantability, fitness for a particular purpose,
              non-infringement or course of performance. Cookbook AI, its
              subsidiaries, affiliates, and its licensors do not warrant that a)
              the Service will function uninterrupted, secure or available at
              any particular time or location; b) any errors or defects will be
              corrected; c) the Service is free of viruses or other harmful
              components; or d) the results of using the Service will meet your
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">12. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of [Insert Jurisdiction], without regard to its conflict of
              law provisions. Our failure to enforce any right or provision of
              these Terms will not be considered a waiver of those rights. If
              any provision of these Terms is held to be invalid or
              unenforceable by a court, the remaining provisions of these Terms
              will remain in effect. These Terms constitute the entire agreement
              between us regarding our Service, and supersede and replace any
              prior agreements we might have between us regarding the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">13. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material we will try to
              provide at least 30 days notice prior to any new terms taking
              effect. What constitutes a material change will be determined at
              our sole discretion. By continuing to access or use our Service
              after those revisions become effective, you agree to be bound by
              the revised terms. If you do not agree to the new terms, please
              stop using the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">14. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at
              [Insert Contact Email].
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
