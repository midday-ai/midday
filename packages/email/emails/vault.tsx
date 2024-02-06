import {
  Body,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
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

export const VaultEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, There’s no need to scramble for things across devices or different drives. Keep all of your files, such as contracts and agreements safe in one place.`;

  return (
    <Html>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0She1ZuWi3hKpA.woff2",
              format: "woff2",
            }}
          />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npST3-TfykywN2u7ZWwU.woff2",
              format: "woff2",
            }}
            fontWeight={500}
          />
        </Head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <Container className="border-0 md:border-1 border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Store your files securely
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/vault-header.png`}
              alt="Vault"
              className="my-0 mx-auto block dark:hidden max-w-[305px] w-full"
            />

            <Img
              src={`${baseUrl}/vault-header-dark.png`}
              alt="Vault"
              className="my-0 mx-auto hidden dark:block w-full max-w-[305px] max-h-[308px]"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              There’s no need to scramble for things across devices or different
              drives. Keep all of your files, such as contracts and agreements
              safe in one place.
            </Text>

            <br />
            <br />

            <Section>
              <Column
                title="Upload your files"
                description="Easily drag and drop your files to upload."
                imgSrc={`${baseUrl}/vault-upload.png`}
              />

              <Column
                title="Create structure"
                description="Create folders and keep a neat and tidy structure."
                imgSrc={`${baseUrl}/vault-structure.png`}
              />

              <Column
                title="Have everything in one place"
                description="Instead of having important documents scattered locally or on different drives, store them safely in Midday."
                imgSrc={`${baseUrl}/vault-overview.png`}
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

export default VaultEmail;
