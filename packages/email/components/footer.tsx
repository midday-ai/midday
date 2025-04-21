import { getEmailUrl } from "@midday/utils/envs";
import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";

const baseUrl = getEmailUrl();

export function Footer() {
  return (
    <Section className="w-full">
      <Hr />

      <br />

      <Text className="text-[21px] font-regular">
        Run your business smarter.
      </Text>

      <br />

      <Row>
        <Column style={{ width: "33%", paddingRight: "10px" }}>
          <Text className="font-medium">Features</Text>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/bOp4NOx"
          >
            Overview
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/VFcNsmQ"
          >
            Inbox
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/uA06kWO"
          >
            Vault
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/x7Fow9L"
          >
            Tracker
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/fkYXc95"
          >
            Invoice
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/dEnP9h5"
          >
            Pricing
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/E24P3oY"
          >
            Engine
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://midday.ai/download"
          >
            Download
          </Link>
        </Column>

        <Column style={{ width: "33%", paddingRight: "10px" }}>
          <Text className="font-medium">Resources</Text>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/fhEy5CL"
          >
            Homepage
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://git.new/midday"
          >
            Github
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/ZrhEMbR"
          >
            Support
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/rofdWKi"
          >
            Terms of service
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/TJIL5mQ"
          >
            Privacy policy
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/IQ1kcN0"
          >
            Branding
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/x5ohOs7"
          >
            Feature Request
          </Link>
        </Column>

        <Column style={{ width: "33%" }}>
          <Text className="font-medium">Company</Text>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/186swoH"
          >
            Story
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/QWyX8Um"
          >
            Updates
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/Dd7M8cl"
          >
            Open startup
          </Link>
          <Link
            className="text-[#707070] text-[14px] block mb-1.5"
            href="https://go.midday.ai/M2Hv420"
          >
            OSS Friends
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/lS72Toq">
            <Img
              src={`${baseUrl}/email/x.png`}
              width="22"
              height="22"
              alt="Midday on X"
            />
          </Link>
        </Column>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/7rhA3rz">
            <Img
              src={`${baseUrl}/email/producthunt.png`}
              width="22"
              height="22"
              alt="Midday on Producthunt"
            />
          </Link>
        </Column>
        <Column className="align-middle w-[40px]">
          <Link href="https://go.midday.ai/anPiuRx">
            <Img
              src={`${baseUrl}/email/discord.png`}
              width="22"
              height="22"
              alt="Midday on Discord"
            />
          </Link>
        </Column>
        <Column className="align-middle">
          <Link href="https://go.midday.ai/Ct3xybK">
            <Img
              src={`${baseUrl}/email/linkedin.png`}
              width="22"
              height="22"
              alt="Midday on LinkedIn"
            />
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Text className="text-[#B8B8B8] text-xs">
        Midday Labs AB - Torsgatan 59 113 37, Stockholm, Sweden.
      </Text>

      <Link
        className="text-[#707070] text-[14px] block"
        href="https://app.midday.ai/settings/notifications"
        title="Unsubscribe"
      >
        Notification preferences
      </Link>

      <br />
      <br />

      <Link href="https://go.midday.ai/FZwOHud">
        <Img
          src={`${baseUrl}/email/logo-footer.png`}
          width="100"
          alt="Midday"
          className="block"
        />
      </Link>
    </Section>
  );
}
