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
  baseUrl: string;
};

export function Footer({ baseUrl }: Props) {
  return (
    <Section>
      <Hr />
      <br />

      <Text className="text-[21px] font-regular">
        Run your bussiness smarter.
      </Text>

      <br />

      <Row>
        <Column className="align-top">
          <Row>
            <Text className="font-medium">Product</Text>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Features</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Pricing</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Story</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Updates</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Download</Link>
          </Row>
        </Column>
        <Column className="align-top">
          <Row>
            <Text className="font-medium">Resources</Text>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Roadmap</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Github</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Support</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Updates</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Privacy policy</Link>
          </Row>
        </Column>
        <Column className="align-top">
          <Row>
            <Text className="font-medium">Solutions</Text>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Self hosted</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">SaaS hosting</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">Open startup</Link>
          </Row>
          <Row className="mb-1.5">
            <Link className="text-[#707070] text-[14px]">OSS Friends</Link>
          </Row>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Column className="align-middle w-[40px]">
          <Img
            src={`${baseUrl}/x.png`}
            width="22"
            height="22"
            alt="Midday on X"
          />
        </Column>
        <Column className="align-middle w-[40px]">
          <Img
            src={`${baseUrl}/producthunt.png`}
            width="22"
            height="22"
            alt="Midday on Producthunt"
          />
        </Column>

        <Column className="align-middle w-[40px]">
          <Img
            src={`${baseUrl}/discord.png`}
            width="22"
            height="22"
            alt="Midday on Discord"
          />
        </Column>

        <Column className="align-middle">
          <Img
            src={`${baseUrl}/github.png`}
            width="22"
            height="22"
            alt="Midday on Github"
          />
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Text className="text-[#B8B8B8] text-xs">
          Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus
          convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum
          nisl, sed faucibus neque.
        </Text>
      </Row>

      <br />

      <Row>
        <Img
          src={`${baseUrl}/logo-footer.png`}
          width="100"
          height="28"
          alt="Midday"
        />
      </Row>

      <br />
    </Section>
  );
}
