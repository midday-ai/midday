"use client";

import React from "react";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Link } from "@react-email/link";
import { Section } from "@react-email/section";
import { Tailwind } from "@react-email/tailwind";
import { Text } from "@react-email/text";

import tailwindConfig from "../tailwind.config";

export type Props = {
  username: string;
  date: string;
};

export function PaymentIssue({ username, date }: Props) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html className="font-sans text-zinc-800">
        <Head />
        <Section className="bg-white">
          <Container className="container mx-auto">
            <Heading className="text-semibold font-sans text-2xl">
              There was an issue with your payment.
            </Heading>
            <Text>Hey {username},</Text>
            <Text>
              We had trouble processing your payment on {date}. Please update
              your payment information below to prevent your account from being
              downgraded.
            </Text>

            <Container className="my-8 flex items-center justify-center">
              <Button
                href="https://tesseract.dev/app/settings/billing/stripe"
                className="rounded bg-black px-4 py-2 text-white"
              >
                Update payment information
              </Button>
            </Container>

            <Hr />
            <Text>
              Need help? Please reach out to{" "}
              <Link href="mailto:support@tesseract.dev">
                support@tesseract.dev
              </Link>{" "}
              or just reply to this email.
            </Text>

            <Text>
              Cheers,
              <br />
              Andreas
            </Text>
          </Container>
        </Section>
      </Html>
    </Tailwind>
  );
}

PaymentIssue.PreviewProps = {
  username: "Mr. Pilkington",
  date: "2024 03 08",
} satisfies Props;

export default PaymentIssue;
