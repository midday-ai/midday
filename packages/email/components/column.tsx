import { Img, Row, Section, Text } from "@react-email/components";
import { getEmailThemeClasses } from "./theme";

type Props = {
  title: string;
  description: string;
  imgSrc: string;
  footer?: string;
};

export function Column({ title, description, footer, imgSrc }: Props) {
  const themeClasses = getEmailThemeClasses();

  return (
    <Section className="text-left p-0 m-0 text-left">
      <Section className="p-0 m-0 w-full w-full w-[265px] inline-block align-top box-border mb-4 md:mb-0 text-left">
        <Section className="text-left p-0 m-0 pb-10">
          <Img src={imgSrc} alt={title} className="w-[245px]" />
        </Section>
      </Section>
      <Section className="inline-block align-top box-border w-full w-[280px] text-left">
        <Section className="text-left p-0 m-0">
          <Text className={`pt-0 m-0 font-medium mb-2 ${themeClasses.text}`}>
            {title}
          </Text>
          <Text className={`p-0 m-0 ${themeClasses.mutedText}`}>
            {description}
          </Text>
          <Text className={`p-0 mt-2 ${themeClasses.mutedText}`}>{footer}</Text>
        </Section>
      </Section>
    </Section>
  );
}
