import { Img, Section } from "@react-email/components";
import React from "react";

export function Logo({ baseUrl }) {
  return (
    <Section className="mt-[32px]">
      <Img
        src={`${baseUrl}/logo.png`}
        width="45"
        height="45"
        alt="Midday"
        className="my-0 mx-auto visible dark:invisible"
      />
      <Img
        src={`${baseUrl}/logo-dark.png`}
        width="45"
        height="45"
        alt="Midday"
        className="my-0 mx-auto invisible dark:visible"
      />
    </Section>
  );
}
