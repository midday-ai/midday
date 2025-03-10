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

export const GetStartedEmail = ({ fullName = "Viktor Hofte" }: Props) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Just checking in to help you get started. Here are a few things you can try today.`;

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
              Get the most out of Midday
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212]">
              Just checking in to help you get started. Here are a few things
              you can try today:
              <br />
              <ul>
                <li>
                  <Link href="https://midday.com/dashboard">
                    <strong>Connect your bank account</strong> – Get a clear
                    financial overview.
                  </Link>
                </li>
              </ul>
              <br />
            </Text>

            <br />

            <Text className="text-[#707070]">Best regards, founders</Text>

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

export default GetStartedEmail;
