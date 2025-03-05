import { getEmailUrl } from "@midday/utils/envs";
import {
  Body,
  Container,
  Font,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface Props {
  fullName: string;
}

const baseUrl = getEmailUrl();

export const WelcomeEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Welcome to Midday! I'm Pontus, one of the founders. It's really important to us that you have a great experience ramping up.`;

  return (
    <Html>
      <Tailwind>
        <head>
          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-400-normal.woff2",
              format: "woff2",
            }}
            fontWeight={400}
            fontStyle="normal"
          />

          <Font
            fontFamily="Geist"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://cdn.jsdelivr.net/npm/@fontsource/geist-sans@5.0.1/files/geist-sans-latin-500-normal.woff2",
              format: "woff2",
            }}
            fontWeight={500}
            fontStyle="normal"
          />
        </head>
        <Preview>{text}</Preview>

        <Body className="bg-[#fff] my-auto mx-auto font-sans">
          <Container
            className="border-transparent md:border-[#E8E7E1] my-[40px] mx-auto p-[20px] max-w-[600px]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo />
            <Heading className="text-[#121212] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Welcome to Midday
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Welcome to Midday! I'm Pontus, one of the founders.
              <br />
              <br />
              At Midday, we're committed to helping you run your business more
              efficiently and making your day-to-day operations smoother.
              <br />
              <br />
              Your success is important to us, and we're here to support you
              every step of the way. If you have any questions or need
              assistance getting started, we're just a message away.
              <br />
              <br />
              Please feel free to reach out anytime by replying directly to this
              email or{" "}
              <Link
                href="https://cal.com/pontus-midday/15min"
                className="text-[#121212] underline"
              >
                scheduling a call with me
              </Link>
              . We'd love to hear from you!
            </Text>

            <br />

            <Img
              src={`${baseUrl}/email/founders.jpeg`}
              alt="Founders"
              className="my-0 mx-auto block w-full"
            />

            <Text className="text-[#707070]">Best regards, founders</Text>

            <Img
              src={`${baseUrl}/email/signature.png`}
              alt="Signature"
              className="block w-full w-[143px] h-[20px]"
            />

            <br />
            <br />

            <GetStarted />

            <br />

            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
