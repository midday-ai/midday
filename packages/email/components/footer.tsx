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

type Props = {
  baseUrl?: string;
};

export function Footer({ baseUrl }: Props) {
  return (
    <Section>
      <Hr className="dark:border-[#242424]" />

      <br />

      <Text className="text-[21px] font-regular">
        Run your bussiness smarter.
      </Text>

      <br />

      <div className="text-[0]">
        <div className="inline-block w-full md:w-1/3 lg:w-1/3 align-top">
          <div>
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
          </div>
        </div>
        <div className="inline-block w-full md:w-1/3 lg:w-1/3 align-top">
          <div>
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
          </div>
        </div>
        <div className="inline-block w-full md:w-1/3 lg:w-1/3 align-top">
          <div>
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
          </div>
        </div>
      </div>

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
