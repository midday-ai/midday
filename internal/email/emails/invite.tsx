import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

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
    ? "https://solomon-ai.app/email"
    : "http://localhost:3000/email";

const baseAppUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://business.solomon-ai.app"
    : "http://localhost:3001";

export const InviteEmail = ({
  invitedByEmail = "bukinoshita@example.com",
  invitedByName = "Yoan Yomba",
  email = "yoanyomba@solomon-ai.co",
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
        <Preview>{t("invite.preview", { teamName })}</Preview>

        <Body className="mx-auto my-auto bg-[#fff] font-sans">
          <Container
            className="mx-auto my-[40px] max-w-[600px] border-transparent p-[20px] md:border-[#E8E7E1]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo baseUrl={baseUrl} />
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-normal text-[#121212]">
              {t("invite.title1")} <strong>{teamName}</strong>{" "}
              {t("invite.title2")} <strong>Solomon AI</strong>
            </Heading>

            <Text className="text-[14px] leading-[24px] text-[#121212]">
              {invitedByName} (
              <Link
                href={`mailto:${invitedByEmail}`}
                className="text-[#121212] no-underline"
              >
                {invitedByEmail}
              </Link>
              ) {t("invite.link1")} <strong>{teamName}</strong>{" "}
              {t("invite.link2")} <strong>Solomon AI</strong>.
            </Text>
            <Section className="mb-[42px] mt-[32px] text-center">
              <Button
                className="rounded-md border border-solid border-[#121212] bg-transparent px-6 py-3 text-center text-[14px] font-medium text-[#121212] text-primary no-underline"
                href={inviteLink}
              >
                {t("invite.join")}
              </Button>
            </Section>

            <Text className="break-all text-[14px] leading-[24px] text-[#707070]">
              {t("invite.link3")}:{" "}
              <Link href={inviteLink} className="text-[#707070] underline">
                {inviteLink}
              </Link>
            </Text>

            <br />
            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                {t("invite.footer1")}{" "}
                <span className="text-[#121212]">{email}</span>.{" "}
                {t("invite.footer2")}{" "}
                <span className="text-[#121212]">{ip}</span>{" "}
                {t("invite.footer3")}{" "}
                <span className="text-[#121212]">{location}</span>.{" "}
                {t("invite.footer4")}
              </Text>
            </Section>

            <br />

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
