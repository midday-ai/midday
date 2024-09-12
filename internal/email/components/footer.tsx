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

type Props = {
  baseUrl?: string;
};

export function Footer({ baseUrl }: Props) {
  return (
    <Section className="w-full">
      <Hr />

      <br />

      <Text className="font-regular text-[21px]">
        A better way to act on your finances
      </Text>

      <br />

      <TripleColumn
        pX={0}
        pY={0}
        styles={{ textAlign: "left" }}
        columnOneContent={
          <Section className="m-0 p-0 text-left">
            <Row>
              <Text className="font-medium">Features</Text>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/pricing"
              >
                Pricing
              </Link>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/download"
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
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/"
              >
                Homepage
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://github.com/SolomonAIEngineering/frontend-financial-platform"
              >
                Github
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/support"
              >
                Support
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/terms"
              >
                Terms of service
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/policy"
              >
                Privacy policy
              </Link>
            </Row>

            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/feature-request"
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
                href="https://solomon-ai.app/story"
              >
                Story
              </Link>
            </Row>
            <Row className="mb-1.5">
              <Link
                className="text-[14px] text-[#707070]"
                href="https://solomon-ai.app/updates/v1.0.0"
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
        <Text className="text-xs text-[#B8B8B8]">Solomon AI</Text>
      </Row>

      <Row>
        <Link
          className="text-[14px] text-[#707070]"
          href="https://business.solomon-ai.app/settings/notifications"
          title="Unsubscribe"
        >
          Notification preferences
        </Link>
      </Row>

      <br />
      <br />

      <Row>
        <Link href="https://solomon-ai.app/">
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
