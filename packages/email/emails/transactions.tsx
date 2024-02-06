import { cn } from "@midday/ui/utils";
import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { format } from "date-fns";
import * as React from "react";
import { Footer } from "../components/footer";
import { Logo } from "../components/logo";
import { getI18n } from "../locales";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  name: string;
  currency: string;
  category?: string;
};

interface TransactionsEmailEmailProps {
  fullName: string;
  transactions: Transaction[];
  locale: string;
}

const defaultTransactions = [
  {
    id: "1",
    date: new Date().toISOString(),
    amount: -1000,
    currency: "USD",
    name: "Spotify",
  },
  {
    id: "2",
    date: new Date().toISOString(),
    amount: 1000,
    currency: "USD",
    name: "H23504959",
    category: "income",
  },
  {
    id: "3",
    date: new Date().toISOString(),
    amount: -1000,
    currency: "USD",
    name: "Webflow",
  },
  {
    id: "4",
    date: new Date().toISOString(),
    amount: -1000,
    currency: "USD",
    name: "Netflix",
  },
];

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://midday.ai/email"
    : "http://localhost:3000/email";

const baseAppUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://app.midday.ai"
    : "http://localhost:3001";

export const TransactionsEmail = ({
  fullName = "Viktor Hofte",
  transactions = defaultTransactions,
  locale = "en",
}: TransactionsEmailEmailProps) => {
  const { t } = getI18n({ locale });
  const firstName = fullName.split(" ").at(0);

  const previewText = t("transactions.preview", {
    firstName,
    numberOfTransactions: transactions.length,
  });

  return (
    <Html>
      <Tailwind>
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pxiTypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr0She1ZuWi3hKpA.woff2",
              format: "woff2",
            }}
          />
          <Font
            fontFamily="Instrument Sans"
            fallbackFontFamily="Helvetica"
            webFont={{
              url: "https://fonts.gstatic.com/s/instrumentsans/v1/pximypc9vsFDm051Uf6KVwgkfoSxQ0GsQv8ToedPibnr-yp2JGEJOH9npST3-TfykywN2u7ZWwU.woff2",
              format: "woff2",
            }}
            fontWeight={500}
          />
        </Head>
        <Preview>{previewText}</Preview>

        <Body className="bg-[#fff] dark:bg-[#121212] my-auto mx-auto font-sans">
          <br />
          <Container className="border border-solid border-[#E8E7E1] dark:border-[#242424] my-[40px] mx-auto p-[20px] max-w-[560px]">
            <Logo baseUrl={baseUrl} />
            <Heading className="text-[#121212] dark:text-[#F5F5F3] text-[21px] font-normal text-center p-0 my-[30px] mx-0">
              {t("transactions.title1")}
              <span className="font-semibold">
                {t("transactions.title2", {
                  numberOfTransactions: transactions.length,
                })}{" "}
              </span>
              {t("transactions.title3")} <br />
              {t("transactions.title4")}
            </Heading>
            <Text className="text-[#121212] dark:text-[#F5F5F3] text-[14px] leading-[24px]">
              {t("transactions.description1", { firstName })},
              <br />
              <br />
              {t("transactions.description2")}{" "}
              <span className="font-semibold">
                {t("transactions.description3", {
                  numberOfTransactions: transactions.length,
                })}{" "}
              </span>
              {t("transactions.description4")}
            </Text>

            <br />

            <table
              style={{ width: "100% !important", minWidth: "100%" }}
              className="border-collapse w-full"
            >
              <thead style={{ width: "100%" }}>
                <tr className="border-0 border-t-[1px] border-b-[1px] border-solid border-[#E8E7E1] dark:border-[#242424] h-[45px]">
                  <th align="left">
                    <Text className="text-[14px] font-semibold m-0 p-0">
                      {t("transactions.date")}
                    </Text>
                  </th>
                  <th align="left" style={{ width: "50%" }}>
                    <Text className="text-[14px] font-semibold m-0 p-0">
                      {t("transactions.description")}
                    </Text>
                  </th>
                  <th align="left">
                    <Text className="text-[14px] font-semibold m-0 p-0">
                      {t("transactions.amount")}
                    </Text>
                  </th>
                </tr>
              </thead>

              <tbody style={{ width: "100%", minWidth: "100% !important" }}>
                {transactions?.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-0 border-b-[1px] border-solid border-[#E8E7E1] dark:border-[#242424] h-[45px]"
                  >
                    <td align="left">
                      <Text className="text-[14px] m-0 p-0 mt-1 pb-1">
                        {format(new Date(transaction.date), "MMM d")}
                      </Text>
                    </td>
                    <td align="left" style={{ width: "50%" }}>
                      <Link
                        href={`${baseAppUrl}/transactions?id=${transaction.id}`}
                        className={cn(
                          "text-[#121212] dark:text-[#F5F5F3]",
                          transaction?.category === "income" &&
                            "!text-[#00C969]"
                        )}
                      >
                        <Text className="text-[14px] m-0 p-0 mt-1 pb-1">
                          {transaction.name}
                        </Text>
                      </Link>
                    </td>
                    <td align="left">
                      <Text
                        className={cn(
                          "text-[14px] m-0 p-0 mt-1 pb-1 text-[#121212] dark:text-[#F5F5F3]",
                          transaction?.category === "income" &&
                            "!text-[#00C969]"
                        )}
                      >
                        {Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: transaction.currency,
                        }).format(transaction.amount)}
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-transparent rounded-md text-primary text-[14px] text-[#121212] dark:text-[#F5F5F3] font-medium no-underline text-center px-6 py-3 border border-solid border-[#121212] dark:border-[#F5F5F3]"
                href={`${baseAppUrl}/transactions?filter=${JSON.stringify({
                  date: {
                    from: transactions.at(0)?.date,
                    to: transactions[transactions.length - 1]?.date,
                  },
                })}`}
              >
                {t("transactions.button")}
              </Button>
            </Section>
            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TransactionsEmail;
