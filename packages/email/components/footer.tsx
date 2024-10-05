import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { TripleColumn } from "responsive-react-email";
import config from "../config/index";

type Props = {
  baseUrl?: string;
};

export function Footer({ baseUrl }: Props) {
  return (
    <Section className="w-full">
      <Hr />

      <br />

      <Text className="font-regular text-[21px]">{config.description}</Text>

      <br />

      <TripleColumn
        pX={0}
        pY={0}
        styles={{ textAlign: "left" }}
        columnOneContent={
          <Section className="m-0 p-0 text-left">
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/pricing`}
              >
                Pricing
              </Link>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/download`}
              >
                Download
              </Link>
            </Row>
          </Section>
        }
        columnOneStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
        columnTwoContent={
          <Section className="m-0 p-0 text-left">
            <Row>
              <Text className="font-medium">Resources</Text>
            </Row>
            <Row className="mb-1.5">
              <Link className="text-[14px] text-[#707070]" href={config.webUrl}>
                Homepage
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/support`}
              >
                Support
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/terms`}
              >
                Terms of service
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/privacy`}
              >
                Privacy policy
              </Link>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/feature-request`}
              >
                Feature Request
              </Link>
            </Row>
          </Section>
        }
        columnTwoStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
        columnThreeContent={
          <Section className="m-0 p-0 text-left">
            <Row>
              <Text className="font-medium">Company</Text>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/story`}
              >
                Story
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href={`${config.webUrl}/updates/v1.0.0`}
              >
                Updates
              </Link>
            </Row>
          </Section>
        }
        columnThreeStyles={{ paddingRight: 0, paddingLeft: 0, width: 185 }}
      />

      <br />
      <br />

      <Row>
        <Column className="w-[40px] align-middle">
          <Link href="https://x.com/solomon_ai">
            <Img
              src={`${baseUrl}/x.png`}
              width="22"
              height="22"
              alt="Solomon AI on X"
            />
          </Link>
        </Column>

        <Column className="w-[40px] align-middle">
          <Link href="https://discord.gg/solomon-ai">
            <Img
              src={`${baseUrl}/discord.png`}
              width="22"
              height="22"
              alt="Solomon AI on Discord"
            />
          </Link>
        </Column>
      </Row>

      <br />
      <br />

      <Row>
        <Text className="text-xs text-[#B8B8B8]">
          Solomon AI - New York, NY
        </Text>
      </Row>

      <Row>
        <Link
          className="text-[14px] text-[#707070]"
          href={`${config.platformUrl}/settings/notifications`}
          title="Unsubscribe"
        >
          Notification preferences
        </Link>
      </Row>

      <br />
      <br />

      <Row>
        <Link href="https://solomon-ai.app">
          <Img
            src={`${baseUrl}/logo-footer.png`}
            width="100"
            alt="Solomon AI"
            className="block"
          />
        </Link>
      </Row>
    </Section>
  );
}
