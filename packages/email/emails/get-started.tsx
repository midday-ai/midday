import {
  Body,
  Container,
  Font,
  Heading,
  Html,
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
            </Text>
            <br />
            <ul className="list-none pl-0 text-[#121212] text-[14px]">
              <li className="mb-2">
                <Text>
                  <strong>Connect your bank account</strong> – Get a clear
                  financial overview.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Track your time</strong> – Stay on top of your hours
                  and never lose billable time.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Send your first invoice</strong> – Get paid faster and
                  track overdue payments effortlessly.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Reconcile transactions</strong> – Use Inbox to gather
                  receipts and match them with transactions.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Store important files</strong> – Keep contracts and
                  agreements secure in Vault.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Use the assistant</strong> – Gain insights and get a
                  deeper understanding of your finances.
                </Text>
              </li>
              <li className="mb-2">
                <Text>
                  <strong>Try the native desktop app</strong> – Faster access to
                  stay in control of your business.
                </Text>
              </li>
            </ul>
            <br />
            <Text className="text-[#121212] text-[14px]">
              Let us know if you have any thoughts or feedback—we'd love to hear
              from you. Just hit reply.
            </Text>
            <br />
            <Text className="text-[#121212] text-[14px]">
              Best,
              <br />
              Pontus & Viktor
            </Text>

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
