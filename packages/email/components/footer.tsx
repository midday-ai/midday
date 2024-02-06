import {
  Column,
  Heading,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";
import { TripleColumn, SingleColumn } from "responsive-react-email";

type Props = {
  baseUrl?: string;
};

export function Footer({ baseUrl }: Props) {
  return (
    <Section className="w-full">
      <Hr className="dark:border-[#242424]" />

      <br />

      <Text className="text-[21px] font-regular">
        Run your bussiness smarter.
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
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Features
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Pricing
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Story
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Updates
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Download
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
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Roadmap
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Github
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Support
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Updates
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Privacy policy
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
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Self hosted
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                SaaS hosting
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
                Open startup
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[#707070] dark:text-[#878787] text-[14px]">
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
          <Link href="https://go.midday.ai/UmCgADb">
            <Img
              src={`${baseUrl}/github.png`}
              width="22"
              height="22"
              alt="Midday on Github"
            />
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Text className="text-[#B8B8B8] dark:text-[#414141] text-xs">
          Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus
          convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum
          nisl, sed faucibus neque.
        </Text>
      </Row>

      <br />

      <Row>
        <Link href="https://go.midday.ai/FZwOHud">
          <Img
            src={`${baseUrl}/logo-footer.png`}
            width="100"
            height="28"
            alt="Midday"
            className="block dark:hidden"
          />
          <Img
            src={`${baseUrl}/logo-footer-dark.png`}
            width="100"
            height="28"
            alt="Midday"
            className="hidden dark:block"
          />
        </Link>
      </Row>
    </Section>
  );
}
