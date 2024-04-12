import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";

import React from "react";
import { TripleColumn } from "responsive-react-email";

type Props = {
  baseUrl?: string;
  unsubscribeLink?: string;
};

export function Footer({ baseUrl, unsubscribeLink }: Props) {
  return (
    <Section className="w-full">
      <Hr />

      <br />

      <Text className="text-[21px] font-regular">
        Run your business smarter.
      </Text>

      <br />

      <TripleColumn
        pX={0}
        pY={0}
        styles={{ textAlign: "left" }}
        columnOneContent={
          <Section className="text-left p-0 m-0">
            <Row>
              <Text className="font-medium">Product</Text>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/fhEy5CL"
              >
                Homepage
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/KKEB90F"
              >
                Pricing
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/Wa3TxOy"
              >
                Story
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/jr5dX4W"
              >
                Updates
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/sXJM9Qv"
              >
                Download
              </Link>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://midday.ai/feature-request"
              >
                Feature Request
              </Link>
            </Row>
          </Section>
        }
        columnOneStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
        columnTwoContent={
          <Section className="text-left p-0 m-0">
            <Row>
              <Text className="font-medium">Resources</Text>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/aTNyqQH"
              >
                Roadmap
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://git.new/midday"
              >
                Github
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/J2j4CM2"
              >
                Support
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/rofdWKi"
              >
                Terms of service
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/TJIL5mQ"
              >
                Privacy policy
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://app.midday.ai/account/support"
              >
                Support
              </Link>
            </Row>
          </Section>
        }
        columnTwoStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
        columnThreeContent={
          <Section className="text-left p-0 m-0">
            <Row>
              <Text className="font-medium">Solutions</Text>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/cduCp4l"
              >
                SaaS hosting
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/yrQlSIz"
              >
                Self hosted
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/Dd7M8cl"
              >
                Open startup
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[#707070] text-[14px]"
                href="https://go.midday.ai/M2Hv420"
              >
                OSS Friends
              </Link>
            </Row>
          </Section>
        }
        columnThreeStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
      />

      <br />
      <br />

      <Row>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/lS72Toq">
            <Img
              src={`${baseUrl}/x.png`}
              width="22"
              height="22"
              alt="Midday on X"
            />
          </Link>
        </Column>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/7rhA3rz">
            <Img
              src={`${baseUrl}/producthunt.png`}
              width="22"
              height="22"
              alt="Midday on Producthunt"
            />
          </Link>
        </Column>

        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/anPiuRx">
            <Img
              src={`${baseUrl}/discord.png`}
              width="22"
              height="22"
              alt="Midday on Discord"
            />
          </Link>
        </Column>

        <Column className="align-middle">
          <Link href="https://go.midday.ai/Ct3xybK">
            <Img
              src={`${baseUrl}/linkedin.png`}
              width="22"
              height="22"
              alt="Midday on LinkedIn"
            />
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Text className="text-[#B8B8B8] text-xs">
          Midday Labs AB - Torsgatan 59 113 37, Stockholm, Sweden.
        </Text>
      </Row>

      {unsubscribeLink && (
        <Row>
          <Link
            className="text-[#707070] text-[14px]"
            href={unsubscribeLink}
            title="Unsubscribe"
          >
            Unsubscribe
          </Link>
        </Row>
      )}

      {!unsubscribeLink && (
        <Row>
          <Link
            className="text-[#707070] text-[14px]"
            href="https://app.midday.ai/settings/notifications"
            title="Unsubscribe"
          >
            Notification preferences
          </Link>
        </Row>
      )}

      <br />
      <br />

      <Row>
        <Link href="https://go.midday.ai/FZwOHud">
          <Img
            src={`${baseUrl}/logo-footer.png`}
            width="100"
            alt="Midday"
            className="block"
          />
        </Link>
      </Row>
    </Section>
  );
}
