import { createIntl } from "@formatjs/intl";

const messages = {
  en: {
    "notifications.match":
      "We just matched the transaction “${transactionName}” against “${fileName}”",
    "notifications.transaction":
      "You have a new transaction of {amount} from {from}",
    "transactions.subject": "New transactions",
    "transactions.preview":
      "Hi {firstName}, We found {numberOfTransactions, plural, =1 {1 transaction} other {# transactions}} thats missing receipts. Feel free to attach them to ease your own or your accountants work for upcoming declerations.",
    "transactions.title1": "You have ",
    "transactions.title2":
      "{numberOfTransactions, plural, =1 {1 transaction} other {# transactions}}",
    "transactions.title3": "thats missing",
    "transactions.title4": "receipts",
    "transactions.description1": "Hi {firstName}",
    "transactions.description2": "We found",
    "transactions.description3":
      "{numberOfTransactions, plural, =1 {1 transaction} other {# transactions}}",
    "transactions.description4":
      "thats missing receipts. Feel free to attach them to ease your own or your accountants work for upcoming declerations",
    "transactions.button": "View transactions",
    "transactions.footer":
      " Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum nisl, sed faucibus neque. Donec lacus mi, rhoncus at dictum eget, pulvinar at metus. Donec cursus tellus erat, a hendrerit elit rutrum ut. Fusce quis tristique ligula. Etiam sit amet enim vitae mauris auctor blandit id et nibh.",
    "transactions.settings": "Notification preferences",
    "transactions.amount": "Amount",
    "transactions.date": "Date",
    "transactions.description": "Description",
    "invite.subject":
      "{invitedByName} invited you to the {teamName} team on Midday",
    "invite.preview": "Join {teamName} on Midday",
    "invite.title1": "Join",
    "invite.title2": "on",
    "invite.link1": "has invited you to the",
    "invite.link2": "on",
    "invite.join": "Join the team",
    "invite.link3": "or copy and paste this URL into your browser",
    "invite.footer1": "This invitation was intended for",
    "invite.footer2": "This invite was sent from",
    "invite.footer3": "located in",
    "invite.footer4":
      "If you were not expecting this invitation, you can ignore this email. If you are concerned about your account's safety, please reply to this email to get in touch with us.",
  },
  sv: {
    "notifications.match":
      "Vi matchade precis transaktionen “${transactionName}” mot “${fileName}”",
    "notifications.transaction":
      "Du har en ny transaktion på {amount} från {from}",
    "transactions.subject": "Nya transaktioner",
    "transactions.preview":
      "Hej {firstName}, Vi hittade {numberOfTransactions, plural, =1 {1 transaktion} other {# transaktioner}} som saknar kvitton. Bifoga dem gärna för att underlätta ditt eget eller dina revisorers arbete inför kommande deklarationer.",
    "transactions.title1": "Du har ",
    "transactions.title2":
      "{numberOfTransactions, plural, =1 {1 transaktion} other {# transaktioner}}",
    "transactions.title3": "som saknar",
    "transactions.title4": "kvitton",
    "transactions.description1": "Hej {firstName}",
    "transactions.description2": "Vi hittade",
    "transactions.description3":
      "{numberOfTransactions, plural, =1 {1 transaktion} other {# transaktioner}}",
    "transactions.description4":
      "som saknar kvitton. Bifoga dem gärna för att underlätta ditt eget eller dina revisorers arbete inför kommande deklarationer",
    "transactions.button": "Visa transaktioner",
    "transactions.footer":
      " Nam imperdiet congue volutpat. Nulla quis facilisis lacus. Vivamus convallis sit amet lectus eget tincidunt. Vestibulum vehicula rutrum nisl, sed faucibus neque. Donec lacus mi, rhoncus at dictum eget, pulvinar at metus. Donec cursus tellus erat, a hendrerit elit rutrum ut. Fusce quis tristique ligula. Etiam sit amet enim vitae mauris auctor blandit id et nibh.",
    "transactions.settings": "Inställningar",
    "transactions.amount": "Belopp",
    "transactions.date": "Datum",
    "transactions.description": "Beskrivning",
    "invite.subject": "{invitedByName} bjöd in dig till {teamName} på Midday",
    "invite.preview": "Gå med i {teamName} på Midday",
    "invite.title1": "Gå med",
    "invite.title2": "på",
    "invite.link1": "har bjudit in dig till",
    "invite.link2": "på",
    "invite.join": "Gå med",
    "invite.link3": "eller kopiera och klistra in denna URL i din webbläsare",
    "invite.footer1": "Denna inbjudan var avsedd för",
    "invite.footer2": "Denna inbjudan skickades från",
    "invite.footer3": "belägen i",
    "invite.footer4":
      "Om du inte väntade dig den här inbjudan kan du ignorera det här e-postmeddelandet. Om du är orolig för ditt kontos säkerhet, vänligen svara på det här e-postmeddelandet för att komma i kontakt med oss.",
  },
};

type Options = {
  locale: string;
};

export function getI18n({ locale }: Options) {
  const intl = createIntl({
    locale,
    messages: messages[locale],
  });

  return {
    t: intl.formatMessage,
  };
}
