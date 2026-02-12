import {
  Body,
  Container,
  Heading,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { format } from "date-fns";
import { InvoiceSchema } from "../components/invoice-schema";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";
import {
  DEFAULT_EMAIL_BUTTON_TEXT,
  defaultEmailBody,
  defaultEmailHeading,
} from "../defaults";

interface Props {
  customerName: string;
  teamName: string;
  link: string;
  // Gmail structured data fields
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  // Customizable email content (falls back to defaults if not provided)
  emailHeading?: string | null;
  emailBody?: string | null;
  emailButtonText?: string | null;
  // Template labels and logo
  logoUrl?: string | null;
  dueDateLabel?: string | null;
  invoiceNoLabel?: string | null;
  // Formatting — should match the invoice template settings
  locale?: string | null;
  dateFormat?: string | null;
}

function formatInvoiceAmount(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatInvoiceDueDate(dueDate: string, dateFormat: string) {
  try {
    return format(new Date(dueDate), dateFormat);
  } catch {
    return dueDate;
  }
}

export const InvoiceEmail = ({
  customerName = "Customer",
  teamName = "Midday",
  link = "https://app.midday.ai/i/1234567890",
  invoiceNumber,
  amount,
  currency,
  dueDate,
  emailHeading,
  emailBody,
  emailButtonText,
  logoUrl,
  dueDateLabel,
  invoiceNoLabel,
  locale,
  dateFormat,
}: Props) => {
  const heading = emailHeading || defaultEmailHeading(teamName);
  const body = emailBody || defaultEmailBody(teamName);
  const buttonText = emailButtonText || DEFAULT_EMAIL_BUTTON_TEXT;
  const text = heading;
  const dueDateLbl = dueDateLabel || "Due";
  const invoiceNoLbl = invoiceNoLabel || "Invoice";
  const resolvedLocale = locale || "en-US";
  const resolvedDateFormat = dateFormat || "MM/dd/yyyy";

  const formattedAmount =
    amount !== undefined && currency
      ? formatInvoiceAmount(amount, currency, resolvedLocale)
      : null;
  const formattedDueDate = dueDate
    ? formatInvoiceDueDate(dueDate, resolvedDateFormat)
    : null;
  const themeClasses = getEmailThemeClasses();
  const lightStyles = getEmailInlineStyles("light");

  // Only render Gmail schema if we have all required data
  const hasSchemaData =
    invoiceNumber && amount !== undefined && currency && dueDate;

  return (
    <EmailThemeProvider preview={<Preview>{text}</Preview>}>
      {/* Gmail structured data - placed in body as some ESPs strip head scripts */}
      {hasSchemaData && (
        <InvoiceSchema
          invoiceNumber={invoiceNumber}
          teamName={teamName}
          amount={amount}
          currency={currency}
          dueDate={dueDate}
          link={link}
        />
      )}
      <Body
        className={`my-auto mx-auto font-sans ${themeClasses.body}`}
        style={lightStyles.body}
      >
        <Container
          className={`my-[40px] mx-auto p-[20px] max-w-[600px] ${themeClasses.container}`}
          style={{
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: lightStyles.container.borderColor,
          }}
        >
          {logoUrl ? (
            <Section className="mt-[32px]">
              <img
                src={logoUrl}
                alt={teamName}
                style={{
                  height: 40,
                  width: "auto",
                  margin: "0 auto",
                  display: "block",
                }}
              />
            </Section>
          ) : (
            <Logo />
          )}
          <Heading
            className={`text-[21px] font-normal text-center p-0 my-[30px] mx-0 ${themeClasses.heading}`}
            style={{ color: lightStyles.text.color }}
          >
            {heading}
          </Heading>

          {formattedAmount && (
            <Text
              className="text-[32px] font-normal text-center m-0 p-0"
              style={{ color: lightStyles.text.color }}
            >
              {formattedAmount}
            </Text>
          )}

          {(formattedDueDate || invoiceNumber) && (
            <Section className="text-center mt-[8px]">
              {formattedDueDate && (
                <Text
                  className={`text-[14px] m-0 p-0 ${themeClasses.mutedText}`}
                  style={{ color: lightStyles.mutedText.color }}
                >
                  {dueDateLbl} {formattedDueDate}
                </Text>
              )}
              {invoiceNumber && (
                <Text
                  className={`text-[13px] m-0 p-0 ${themeClasses.mutedText}`}
                  style={{ color: lightStyles.mutedText.color }}
                >
                  {invoiceNoLbl} #{invoiceNumber}
                </Text>
              )}
            </Section>
          )}

          <Section className="text-center mt-[40px] mb-[40px]">
            <Button href={link}>{buttonText}</Button>
          </Section>

          <Hr
            className="border-t my-0"
            style={{ borderColor: lightStyles.container.borderColor }}
          />

          <Text
            className={`text-[13px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            {body.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </Text>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InvoiceEmail;
