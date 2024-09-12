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
        alt="Solomon AI"
        className="mx-auto my-0 block"
      />
    </Section>
  );
}
