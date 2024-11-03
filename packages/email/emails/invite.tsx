import { getAppUrl } from "@midday/utils/envs";
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

interface Props {
  email?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  teamName?: string;
  inviteCode?: string;
  ip?: string;
  location?: string;
  locale: string;
}

const baseAppUrl = getAppUrl();

export const InviteEmail = ({
  invitedByEmail = "bukinoshita@example.com",
  invitedByName = "Pontus Abrahamsson",
  email = "pontus@lostisland.co",
  teamName = "Acme Co",
  inviteCode = "jnwe9203frnwefl239jweflasn1230oqef",
  ip = "204.13.186.218",
  location = "São Paulo, Brazil",
  locale = "en",
}: Props) => {
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

        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo />
            <Heading className="mx-0 my-[30px] p-0 text-[24px] font-normal text-[#121212] text-center">
              {t("invite.title1")} <strong>{teamName}</strong>{" "}
              {t("invite.title2")} <strong>Midday</strong>
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
              {t("invite.link2")} <strong>Midday</strong>.
            </Text>
            <Section className="mb-[42px] mt-[32px] text-center">
              <Button
                className="bg-transparent text-primary text-[14px] text-[#121212] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212]"
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

            <br />
            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                {t("invite.footer1")}{" "}
                <span className="text-[#121212] ">{email}</span>.{" "}
                {t("invite.footer2")}{" "}
                <span className="text-[#121212] ">{ip}</span>{" "}
                {t("invite.footer3")}{" "}
                <span className="text-[#121212] ">{location}</span>.{" "}
                {t("invite.footer4")}
              </Text>
            </Section>

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
