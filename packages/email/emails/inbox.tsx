import {
  Body,
  Container,
  Font,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Column } from "../components/column";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface OverviewProps {
  fullName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const InboxEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, With your own personalised email address together with Midday AI, you get automatic matching of incoming invoices or receipts to the correct transaction. When it comes time to export, all of your transactions and attachments are ready to go.`;

  return (
    <Html>
      <Tailwind>
        <head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />
        </head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Magic Inbox
            </Heading>

            <Img
              src={`${baseUrl}/magic-inbox-header.png`}
              alt="Overview"
              className="my-0 mx-auto block max-w-[597px] w-full"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              With your own personalised email address together with Midday AI,
              you get automatic matching of incoming invoices or receipts to the
              correct transaction. When it comes time to export, all of your
              transactions and attachments are ready to go.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Use your personilized email"
                description="Copy your personilized Midday email and add it as a receipient to any purchase or subscription."
                imgSrc={`${baseUrl}/inbox-email.png`}
              />

              <Column
                title="Automatic mapping to an existing transaction"
                description="When the receipt or invoice is recieved, Midday automatically scans the invoice and finds the transaction. Voila, your transaction now has a the right attachment. "
                imgSrc={`${baseUrl}/inbox-mapping.png`}
              />

              <Column
                title="Export"
                description="Select any timeframe you want and export your transactions, now with the attached receipt or invoice."
                imgSrc={`${baseUrl}/inbox-export.png`}
              />
            </Section>

            <br />

            <GetStarted />

            <br />

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InboxEmail;
