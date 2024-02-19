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

export const VaultEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, There’s no need to scramble for things across devices or different drives. Keep all of your files, such as contracts and agreements safe in one place.`;

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
              Store your files securely
            </Heading>

            <br />

            <Img
              src={`${baseUrl}/vault-header.png`}
              alt="Vault"
              className="my-0 mx-auto block max-w-[305px] w-full"
            />

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
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
