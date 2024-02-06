import { Column as TwColumn, Img, Row, Text } from "@react-email/components";
import React from "react";

type Props = {
  title: string;
  description: string;
  imgSrc: string;
  footer?: string;
};

export function Column({ title, description, imgSrc, footer }: Props) {
  return (
    <Row className="mb-8">
      <TwColumn className="md:mr-6 block w-full">
        <Img src={imgSrc} alt={title} className="md:w-[245px] w-full" />
      </TwColumn>
      <TwColumn className="align-top w-full mt-4 block md:table-cell">
        <Text className="pt-0 m-0 font-medium">{title}</Text>
        <Text className="text-[#707070] p-0 m-0">{description}</Text>
        <Text className="text-[#707070] p-0 mt-2">{footer}</Text>
      </TwColumn>
    </Row>
  );
}
