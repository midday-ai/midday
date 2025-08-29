// @ts-nocheck - let's use https://www.npmjs.com/package/@languine/react-email
export interface TranslationParams {
  [key: string]: string | number | undefined;
}

export function translations(locale: string, params?: TranslationParams) {
  switch (locale) {
    case "en":
      return {
        "notifications.match": `We matched the transaction “${params?.transactionName}” against “${params?.fileName}”`,
        "notifications.transactions":
          params?.numberOfTransactions &&
          typeof params?.numberOfTransactions === "number" &&
          params?.numberOfTransactions > 1
            ? `You have ${params?.numberOfTransactions} new transactions`
            : `You have a new transaction of ${params?.amount} from ${params?.name}`,
        "notifications.invoicePaid": `Invoice ${params?.invoiceNumber} has been paid`,
        "notifications.invoiceOverdue": `Invoice ${params?.invoiceNumber} is overdue`,
        "transactions.subject": "New transactions",
        "transactions.preview": `${params?.firstName ? `Hi ${params?.firstName}, ` : ""}You have ${
          params?.numberOfTransactions
        } ${
          params?.numberOfTransactions > 1
            ? "new transactions"
            : "new transaction"
        }`,
        "transactions.title1": "You have ",
        "transactions.title2": `${params?.numberOfTransactions} ${
          params?.numberOfTransactions > 1
            ? "new transactions"
            : "new transaction"
        }`,
        "transactions.description1": `${params?.firstName ? `Hi ${params?.firstName}` : "Hello"}`,
        "transactions.description2": "We found",
        "transactions.description3": `${params?.numberOfTransactions} ${
          params?.numberOfTransactions > 1
            ? "new transactions"
            : "new transaction"
        }`,
        "transactions.description4": `${params?.teamName ? `for your team ${params?.teamName}` : "for your account"}. We'll automatically match them against receipts in your inbox, or you can simply reply to this email with the receipts.`,
        "transactions.button": "View transactions",
        "transactions.settings": "Notification preferences",
        "transactions.amount": "Amount",
        "transactions.date": "Date",
        "transactions.description": "Description",
        "invite.subject": `${params?.invitedByName} invited you to the ${params?.teamName} team on Midday`,
        "invite.preview": `Join ${params?.teamName} on Midday`,
        "invite.title1": "Join",
        "invite.title2": "on",
        "invite.link1": "has invited you to the",
        "invite.link2": "team on",
        "invite.join": "Join the team",
        "invite.link3": "or copy and paste this URL into your browser",
        "invite.footer1": "This invitation was intended for",
        "invite.footer2": "This invite was sent from",
        "invite.footer4":
          "If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.",
        "invoice.overdue.subject": `Invoice #${params?.invoiceNumber} is overdue`,
        "invoice.paid.subject": `Invoice #${params?.invoiceNumber} has been paid`,
        "invoice.sent.subject": `${params?.teamName} sent you an invoice`,
        "invoice.reminder.subject": `Reminder: Payment for ${params?.invoiceNumber}`,
      };
    case "sv":
      return {
        "notifications.match": `Vi matchade transaktionen “${params?.transactionName}” mot “${params?.fileName}”`,
        "notifications.transactions":
          params?.numberOfTransactions &&
          typeof params?.numberOfTransactions === "number" &&
          params?.numberOfTransactions > 1
            ? `Du har ${params?.numberOfTransactions} nya transaktioner`
            : `Du har en ny transaktion på ${params?.amount} från ${params?.name}`,
        "notifications.invoicePaid": `Faktura ${params?.invoiceNumber} har betalats`,
        "notifications.invoiceOverdue": `Faktura ${params?.invoiceNumber} är försenad`,
        "transactions.subject": "Nya transaktioner",
        "transactions.preview": `${params?.firstName ? `Hej ${params?.firstName}, ` : ""}Vi hittade ${
          params?.numberOfTransactions
        } ${
          params?.numberOfTransactions > 1
            ? "nya transaktioner"
            : "nya transaktion"
        }.`,
        "transactions.title1": "Du har ",
        "transactions.title2": `${params?.numberOfTransactions} ${
          params?.numberOfTransactions > 1
            ? "nya transaktioner"
            : "nya transaktion"
        }`,
        "transactions.description1": `${params?.firstName ? `Hej ${params?.firstName}` : "Hej"}`,
        "transactions.description2": "Vi hittade",
        "transactions.description3": `${params?.numberOfTransactions} ${
          params?.numberOfTransactions > 1
            ? "nya transaktioner"
            : "nya transaktion"
        }`,
        "transactions.description4": `${params?.teamName ? `för ditt team ${params?.teamName}` : "på ditt konto"}. Vi matchar dem automatiskt mot kvitton i din inkorg, eller så kan du svara på detta email med dina kvitton.`,
        "transactions.button": "Visa transaktioner",
        "transactions.footer":
          " Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum nisl, sed faucibus neque. Donec lacus mi, rhoncus at dictum eget, pulvinar at metus. Donec cursus tellus erat, a hendrerit elit rutrum ut. Fusce quis tristique ligula. Etiam sit amet enim vitae mauris auctor blandit id et nibh.",
        "transactions.settings": "Inställningar",
        "transactions.amount": "Belopp",
        "transactions.date": "Datum",
        "transactions.description": "Beskrivning",
        "invite.subject": `${params?.invitedByName} bjöd in dig till ${params?.teamName} på Midday`,
        "invite.preview": `Gå med i ${params?.teamName} på Midday`,
        "invite.title1": "Gå med",
        "invite.title2": "på",
        "invite.link1": "har bjudit in dig till",
        "invite.link2": "på",
        "invite.join": "Gå med",
        "invite.link3":
          "eller kopiera och klistra in denna URL i din webbläsare",
        "invite.footer1": "Denna inbjudan var avsedd för",
        "invite.footer2": "Denna inbjudan skickades från",
        "invite.footer4":
          "Om du inte väntade dig den här inbjudan kan du ignorera det här e-postmeddelandet. Om du är orolig för ditt kontos säkerhet, vänligen svara på det här e-postmeddelandet för att komma i kontakt med oss.",
        "invoice.overdue.subject": `Faktura #${params?.invoiceNumber} är försenad`,
        "invoice.paid.subject": `Faktura #${params?.invoiceNumber} har betalats`,
        "invoice.sent.subject": `${params?.teamName} har skickat dig en faktura`,
        "invoice.reminder.subject": `Påminnelse: Betalning för ${params?.invoiceNumber}`,
      };

    default:
      return;
  }
}
