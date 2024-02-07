import {
  Body,
  Container,
  Font,
  Heading,
  Html,
  Img,
  Preview,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Footer } from "../components/footer";
import { GetStarted } from "../components/get-started";
import { Logo } from "../components/logo";

interface OverviewProps {
  fullName: string;
}

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

export const WelcomeEmail = ({ fullName = "Viktor Hofte" }: OverviewProps) => {
  const firstName = fullName.split(" ").at(0);
  const text = `Hi ${firstName}, Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras lacinia lacus non fermentum commodo. Quisque accumsan varius finibus. Sed nibh felis, varius ultrices turpis non, pharetra feugiat odio. Integer pharetra sem at nunc commodo, et semper metus fringilla. Phasellus a condimentum erat. Suspendisse potenti. Sed lobortis, metus eu facilisis ullamcorper, mauris risus interdum magna, vitae commodo ante nunc vel nisl. Aliquam erat volutpat. Aliquam et egestas lacus, quis aliquam ipsum. Nam accumsan lorem nisi, a rutrum augue porttitor vel. In hac habitasse platea dictumst. Donec efficitur, nulla eget bibendum sollicitudin, neque ipsum interdum sem, non imperdiet est leo laoreet magna. Etiam urna ligula, vestibulum nec libero id, ultricies egestas lorem.`;

  return (
    <Html>
      <Tailwind>
        <head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />

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

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <Container className="border-0 md:border-1 border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[600px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              Welcome to Midday
            </Heading>

            <br />

            <span className="font-medium">Hi {firstName},</span>
            <Text className="text-[#121212] dark:text-[#F5F5F3]">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras
              lacinia lacus non fermentum commodo. Quisque accumsan varius
              finibus. Sed nibh felis, varius ultrices turpis non, pharetra
              feugiat odio. Integer pharetra sem at nunc commodo, et semper
              metus fringilla. Phasellus a condimentum erat. Suspendisse
              potenti. Sed lobortis, metus eu facilisis ullamcorper, mauris
              risus interdum magna, vitae commodo ante nunc vel nisl. Aliquam
              erat volutpat. Aliquam et egestas lacus, quis aliquam ipsum. Nam
              accumsan lorem nisi, a rutrum augue porttitor vel. In hac
              habitasse platea dictumst. Donec efficitur, nulla eget bibendum
              sollicitudin, neque ipsum interdum sem, non imperdiet est leo
              laoreet magna. Etiam urna ligula, vestibulum nec libero id,
              ultricies egestas lorem.
            </Text>

            <br />

            <Img
              src={`${baseUrl}/founders.jpg`}
              alt="Founders"
              className="my-0 mx-auto block w-full"
            />

            <Text className="text-[#707070] dark:text-[#878787]">
              Best regards, founders
            </Text>

            <Img
              src={`${baseUrl}/signature-dark.png`}
              alt="Signature"
              className="block w-full w-[143px] h-[20px]"
            />

            <br />
            <br />

            <GetStarted />

            <br />

            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
