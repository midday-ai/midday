import { cn } from "@midday/ui/cn";
import {
  Body,
  Button,
  Container,
  Font,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { format } from "date-fns";

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
  status: "pending" | "posted";
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
    status: "pending",
  },
  {
    id: "2",
    date: new Date().toISOString(),
    amount: 1000,
    currency: "USD",
    name: "H23504959",
    category: "income",
    status: "pending",
  },
  {
    id: "3",
    date: new Date().toISOString(),
    amount: -1000,
    currency: "USD",
    name: "Webflow",
    status: "posted",
  },
  {
    id: "4",
    date: new Date().toISOString(),
    amount: -1000,
    currency: "USD",
    name: "Netflix",
    status: "posted",
  },
];

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://solomon-ai.app/email"
    : "http://localhost:3000/email";

const baseAppUrl =
  process.env.VERCEL_ENV === "production"
    ? "https://business.solomon-ai.app"
    : "http://localhost:3001";

export const TransactionsEmail = ({
  fullName = "Solomon AI Customer",
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
        <head>
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
        <Preview>{previewText}</Preview>

        <Body className="mx-auto my-auto bg-[#fff] font-sans">
          <Container
            className="mx-auto my-[40px] max-w-[600px] border-transparent p-[20px] md:border-[#E8E7E1]"
            style={{ borderStyle: "solid", borderWidth: 1 }}
          >
            <Logo baseUrl={baseUrl} />
            <Heading className="mx-0 my-[30px] p-0 text-center text-[21px] font-normal text-[#121212]">
              {t("transactions.title1")}
              <span className="font-semibold">
                {t("transactions.title2", {
                  numberOfTransactions: transactions.length,
                })}{" "}
              </span>
              {t("transactions.title3")} <br />
              {t("transactions.title4")}
            </Heading>
            <Text className="text-[14px] leading-[24px] text-[#121212]">
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
              className="w-full border-collapse"
            >
              <thead style={{ width: "100%" }}>
                <tr className="h-[45px] border-0 border-b-[1px] border-t-[1px] border-solid border-[#E8E7E1]">
                  <th align="left">
                    <Text className="m-0 p-0 text-[14px] font-semibold">
                      {t("transactions.date")}
                    </Text>
                  </th>
                  <th align="left" style={{ width: "50%" }}>
                    <Text className="m-0 p-0 text-[14px] font-semibold">
                      {t("transactions.description")}
                    </Text>
                  </th>
                  <th align="left">
                    <Text className="m-0 p-0 text-[14px] font-semibold">
                      {t("transactions.amount")}
                    </Text>
                  </th>
                </tr>
              </thead>

              <tbody style={{ width: "100%", minWidth: "100% !important" }}>
                {transactions?.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="h-[45px] border-0 border-b-[1px] border-solid border-[#E8E7E1]"
                  >
                    <td align="left">
                      <Text className="m-0 mt-1 p-0 pb-1 text-[14px]">
                        {format(new Date(transaction.date), "MMM d")}
                      </Text>
                    </td>
                    <td align="left" style={{ width: "50%" }}>
                      <Link
                        href={`${baseAppUrl}/transactions?id=${transaction.id}`}
                        className={cn(
                          "text-[#121212]",
                          transaction?.category === "income" &&
                            "!text-[#00C969]",
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <Text className="m-0 mt-1 line-clamp-1 p-0 pb-1 text-[14px]">
                            {transaction.name}
                          </Text>

                          {transaction.status === "pending" && (
                            <div className="flex h-[22px] items-center space-x-1 rounded-md border px-2 py-1 text-xs text-[#878787]">
                              <span>Pending</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td align="left">
                      <Text
                        className={cn(
                          "m-0 mt-1 p-0 pb-1 text-[14px] text-[#121212]",
                          transaction?.category === "income" &&
                            "!text-[#00C969]",
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

            <br />

            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                className="rounded-md border border-solid border-[#121212] bg-transparent px-6 py-3 text-center text-[14px] font-medium text-[#121212] text-primary no-underline"
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

            <br />
            <Footer baseUrl={baseUrl} />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default TransactionsEmail;
