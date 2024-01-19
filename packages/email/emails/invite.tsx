import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
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
    ? "https://midday.ai"
    : "http://localhost:3000";

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
      <Head>
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
      <Tailwind>
        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container className="mx-auto my-[80px] max-w-[465px] rounded p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src={`${baseUrl}/email/logo.png`}
                width="45"
                height="45"
                alt="Midday"
                className="my-0 mx-auto"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-[24px] font-normal text-black">
              {t("cows", { count: 3 })}
              {/* {t("invite.title1")} <strong>{teamName}</strong>{" "}
              {t("invite.title2")} <strong>Midday</strong> */}
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              {invitedByName} (
              <Link
                href={`mailto:${invitedByEmail}`}
                className="text-black no-underline"
              >
                {invitedByEmail}
              </Link>
              ) {t("invite.link1")} <strong>{teamName}</strong>{" "}
              {t("invite.link2")} <strong>Midday</strong>.
            </Text>
            <Section className="mb-[42px] mt-[32px] text-center">
              <Button
                className="rounded bg-black px-[20px] py-[12px] text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                {t("invite.join")}
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black break-all">
              {t("invite.link3")}:{" "}
              <Link href={inviteLink} className="text-black no-underline">
                {inviteLink}
              </Link>
            </Text>

            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                {t("invite.footer1")}{" "}
                <span className="text-black">{email}</span>.{" "}
                {t("invite.footer2")} <span className="text-black">{ip}</span>{" "}
                {t("invite.footer3")}{" "}
                <span className="text-black">{location}</span>.{" "}
                {t("invite.footer4")}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
