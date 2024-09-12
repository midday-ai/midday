"use client";

import React from "react";
import { Button } from "@react-email/button";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Section } from "@react-email/section";
import { Tailwind } from "@react-email/tailwind";
import { Text } from "@react-email/text";

import tailwindConfig from "../tailwind.config";

export type Props = {
  username: string;
};

export function SubscriptionEnded({ username }: Props) {
  return (
    <Tailwind config={tailwindConfig}>
      <Html className="font-sans text-zinc-800">
        <Head />
        <Section className="bg-white">
          <Container className="container mx-auto">
            <Heading className="text-semibold font-sans text-2xl">
              Your Tesseract subscription has ended.
            </Heading>
            <Text>Hey {username},</Text>
            <Text>
              We're reaching out to let you know that your trial period has come
              to an end for Tesseract Pro. We have downgraded the workspace to
              free, which means you lose access to the workspace, but we will
              retain all your team and key data.
            </Text>
            <Text>
              If you want to continue with Tesseract Pro, click the button
              below, and you can add your credit card.
            </Text>

            <Container className="my-8 flex items-center justify-center">
              <Button
                href="https://tesseract.dev/app/settings/billing"
                className="rounded bg-black px-4 py-2 text-white"
              >
                Upgrade Now
              </Button>
            </Container>

            <Hr />
            <Text>
              If you have any feedback, please reply to this email. We would
              love to hear all about it.
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

SubscriptionEnded.PreviewProps = {
  username: "Mike Wazowski",
} satisfies Props;

export default SubscriptionEnded;
