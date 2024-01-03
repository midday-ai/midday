import {
  Body,
  Button,
  Column,
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

interface InviteEmailProps {
  email?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  teamName?: string;
  inviteCode?: string;
  ip?: string;
  location?: string;
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
}: InviteEmailProps) => {
  const previewText = `Join ${teamName} on Midday`;
  const inviteLink = `${baseAppUrl}/invite/${inviteCode}`;

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
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-[#F6F6F3] my-auto mx-auto font-sans">
          <Container className="mx-auto my-[80px] w-[465px] rounded p-[20px]">
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
              Join <strong>{teamName}</strong> on <strong>Midday</strong>
            </Heading>

            <Text className="text-[14px] leading-[24px] text-black">
              {invitedByName} (
              <Link
                href={`mailto:${invitedByEmail}`}
                className="text-black no-underline"
              >
                {invitedByEmail}
              </Link>
              ) has invited you to the <strong>{teamName}</strong> team on{" "}
              <strong>Midday</strong>.
            </Text>
            <Section className="mb-[42px] mt-[32px] text-center">
              <Button
                className="rounded bg-black px-[20px] py-[12px] text-center text-[12px] font-semibold text-white no-underline"
                href={inviteLink}
              >
                Join the team
              </Button>
            </Section>

            <Text className="text-[14px] leading-[24px] text-black">
              or copy and paste this URL into your browser:{" "}
              <Link href={inviteLink} className="text-black no-underline">
                {inviteLink}
              </Link>
            </Text>

            <Section>
              <Text className="text-[12px] leading-[24px] text-[#666666]">
                This invitation was intended for
                <span className="text-black">{email} </span>. This invite was
                sent from <span className="text-black">{ip}</span> located in{" "}
                <span className="text-black">{location}</span>. If you were not
                expecting this invitation, you can ignore this email. If you are
                concerned about your account&apos;s safety, please reply to this
                email to get in touch with us.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default InviteEmail;
