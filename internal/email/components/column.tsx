import React from "react";
import {
  Img,
  Row,
  Section,
  Text,
  Column as TwColumn,
} from "@react-email/components";

type Props = {
  title: string;
  description: string;
  imgSrc: string;
  footer?: string;
};

export function Column({ title, description, footer, imgSrc }: Props) {
  return (
    <Section className="m-0 p-0 text-left">
      <Section className="m-0 mb-4 box-border inline-block w-[265px] w-full p-0 text-left align-top md:mb-0">
        <Section className="m-0 p-0 pb-10 text-left">
          <Img src={imgSrc} alt={title} className="w-[245px]" />
        </Section>
      </Section>
      <Section className="box-border inline-block w-[280px] w-full text-left align-top">
        <Section className="m-0 p-0 text-left">
          <Text className="m-0 mb-2 pt-0 font-medium">{title}</Text>
          <Text className="m-0 p-0 text-[#707070]">{description}</Text>
          <Text className="mt-2 p-0 text-[#707070]">{footer}</Text>
        </Section>
      </Section>
    </Section>
  );
}
