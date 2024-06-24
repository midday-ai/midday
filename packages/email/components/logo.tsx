import { Img, Section } from "@react-email/components";

type Props = {
  baseUrl: string;
};

export function Logo({ baseUrl }: Props) {
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
