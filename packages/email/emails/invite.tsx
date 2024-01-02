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

interface InviteUserEmailProps {
  userImage?: string;
  email?: string;
  invitedByEmail?: string;
  invitedByName?: string;
  teamName?: string;
  teamImage?: string;
  inviteLink?: string;
  ip?: string;
  location?: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const InviteUserEmail = ({
  userImage = "https://lh3.googleusercontent.com/a/ACg8ocI0Te8WfHr_8nHOdWtt7H2JNOEt6f6Rr_wBNWknzp_Qlk4=s96-c",
  invitedByEmail = "bukinoshita@example.com",
  invitedByName = "Pontus Abrahamsson",
  email = "pontus@lostisland.co",
  teamName = "Acme Co",
  teamImage = "https://service.midday.ai/storage/v1/object/public/avatars/dd6a039e-d071-423a-9a4d-9ba71325d890/Screenshot%202023-12-29%20at%2023.33.10.png",
  inviteLink = "https://app.midday.ai/invite/jnwe9203frnwefl239jweflasn1230oqef",
  ip = "204.13.186.218",
  location = "São Paulo, Brazil",
}: InviteUserEmailProps) => {
  const previewText = `Join ${teamName} on Midday`;

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
                src={`${baseUrl}/logo.png`}
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
            <Section className="my-10">
              <Row>
                <Column align="right">
                  <Img
                    className="rounded-full"
                    src={userImage}
                    width="64"
                    height="64"
                  />
                </Column>
                <Column align="center">
                  <Img
                    src={`${baseUrl}/arrow.png`}
                    width="12"
                    height="9"
                    alt="invited you to"
                  />
                </Column>
                <Column align="left">
                  <Img
                    className="rounded-full"
                    src={teamImage}
                    width="64"
                    height="64"
                  />
                </Column>
              </Row>
            </Section>
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

export default InviteUserEmail;
