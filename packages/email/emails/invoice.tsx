import {
  Body,
  Container,
  Heading,
  Hr,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { InvoiceSchema } from "../components/invoice-schema";
import { Logo } from "../components/logo";
import {
  Button,
  EmailThemeProvider,
  getEmailInlineStyles,
  getEmailThemeClasses,
} from "../components/theme";

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
  emailSubject?: string | null;
  emailBody?: string | null;
  emailButtonText?: string | null;
  // Template labels and logo
  logoUrl?: string | null;
  dueDateLabel?: string | null;
  invoiceNoLabel?: string | null;
}

const DEFAULT_EMAIL_BODY =
  "If you have any questions, just reply to this email.";

function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function formatDueDate(dueDate: string) {
  try {
    return new Date(dueDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
  emailSubject,
  emailBody,
  emailButtonText,
  logoUrl,
  dueDateLabel,
  invoiceNoLabel,
}: Props) => {
  const heading = emailSubject || `Invoice from ${teamName}`;
  const body = emailBody || DEFAULT_EMAIL_BODY;
  const buttonText = emailButtonText || "View invoice";
  const text = heading;
  const dueDateLbl = dueDateLabel || "Due";
  const invoiceNoLbl = invoiceNoLabel || "Invoice";

  const formattedAmount =
    amount !== undefined && currency ? formatAmount(amount, currency) : null;
  const formattedDueDate = dueDate ? formatDueDate(dueDate) : null;
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
            {body}
          </Text>

          <Text
            className={`text-[13px] ${themeClasses.mutedText}`}
            style={{ color: lightStyles.mutedText.color }}
          >
            Thanks,
            <br />
            {teamName}
          </Text>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
};

export default InvoiceEmail;
