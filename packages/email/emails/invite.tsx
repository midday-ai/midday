import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import { getI18n } from "../locales";

interface InviteEmailProps {
  email?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  teamName?: string;
  inviteCode?: string;
  ip?: string;
  location?: string;
  locale: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

const baseAppUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://app.midday.ai"
    : "http://localhost:3001";

export const InviteEmail = ({
  invitedByEmail = "bukinoshita@example.com",
  invitedByName = "Pontus Abrahamsson",
  email = "pontus@lostisland.co",
  teamName = "Acme Co",
  inviteCode = "jnwe9203frnwefl239jweflasn1230oqef",
  ip = "204.13.186.218",
  location = "São Paulo, Brazil",
  locale = "en",
}: InviteEmailProps) => {
  const { t } = getI18n({ locale });
  const inviteLink = `${baseAppUrl}/teams/invite/${inviteCode}`;

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
        <Preview>{t("invite.preview", { teamName })}</Preview>

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[560px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="mx-0 my-[30px] p-0 text-[24px] font-normal text-[#121212] dark:text-[#F5F5F3] text-center">
              {t("invite.title1")} <strong>{teamName}</strong>{" "}
              {t("invite.title2")} <strong>Midday</strong>
            </Heading>

            <Text className="text-[14px] leading-[24px] text-[#121212] dark:text-[#F5F5F3]">
              {invitedByName} (
              <Link
                href={`mailto:${invitedByEmail}`}
                className="text-[#121212] dark:text-[#F5F5F3] no-underline"
              >
                {invitedByEmail}
              </Link>
              ) {t("invite.link1")} <strong>{teamName}</strong>{" "}
              {t("invite.link2")} <strong>Midday</strong>.
            </Text>
            <Section className="mb-[42px] mt-[32px] text-center">
              <Button
                className="bg-transparent rounded-md text-primary text-[14px] text-[#121212] dark:text-[#F5F5F3] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212] dark:border-[#F5F5F3]"
                href={inviteLink}
              >
                {t("invite.join")}
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-[#707070] break-all">
              {t("invite.link3")}:{" "}
              <Link href={inviteLink} className="text-[#707070] underline">
                {inviteLink}
              </Link>
            </Text>

            <Hr className="border-0 border-b-[1px] border-solid border-[#E8E7E1] my-[45px] mx-0 w-full dark:border-[#242424]" />

            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                {t("invite.footer1")}{" "}
                <span className="text-[#121212] dark:text-[#F5F5F3]">
                  {email}
                </span>
                . {t("invite.footer2")}{" "}
                <span className="text-[#121212] dark:text-[#F5F5F3]">{ip}</span>{" "}
                {t("invite.footer3")}{" "}
                <span className="text-[#121212] dark:text-[#F5F5F3]">
                  {location}
                </span>
                . {t("invite.footer4")}
              </Text>
            </Section>

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
