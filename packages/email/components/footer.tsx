import { Column, Hr, Row, Section, Text } from "@react-email/components";
import React from "react";

export function Footer() {
  return (
    <Section>
      <Hr />
      <Row>
        <Column>A</Column>
        <Column>B</Column>
        <Column>C</Column>
      </Row>
    </Section>
  );
}

{
  /* <Hr className="border-0 border-b-[1px] border-solid border-[#E8E7E1] my-[45px] mx-0 w-full" />
            <Link href={`${baseAppUrl}/settings/notifications`}>
              <Text className="text-[#878787] text-[12px] underline">
                {t("transactions.settings")}
              </Text>
            </Link> */
}
