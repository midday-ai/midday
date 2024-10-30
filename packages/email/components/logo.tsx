import { Img, Section } from "@react-email/components";
import { getEnvironmentUrl } from "utils/env";

const baseUrl = getEnvironmentUrl();

export function Logo() {
  return (
    <Section className="mt-[32px]">
      <Img
        src={`${baseUrl}/logo.png`}
        width="45"
        height="45"
        alt="Midday"
        className="my-0 mx-auto block"
      />
    </Section>
  );
}
