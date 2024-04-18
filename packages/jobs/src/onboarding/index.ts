import { generateUnsubscribeLink } from "@midday/email";
import FinancialOverViewEmail from "@midday/email/emails/financial-overview";
import GetStartedEmail from "@midday/email/emails/get-started";
import InboxEmail from "@midday/email/emails/inbox";
import PreAccountingEmail from "@midday/email/emails/pre-accounting";
import TimeTrackEmail from "@midday/email/emails/time-tracker";
import VaultEmail from "@midday/email/emails/vault";
import WelcomeEmail from "@midday/email/emails/welcome";
import { renderAsync } from "@react-email/components";
import { Resend } from "@trigger.dev/resend";
import { eventTrigger } from "@trigger.dev/sdk";
import { nanoid } from "nanoid";
import { z } from "zod";
import { client } from "../client";
import { Events } from "../constants";

const resend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY!,
});

client.defineJob({
  id: "onboarding-emails",
  name: "Onboarding Emails",
  version: "1.0.0",
  enabled: false,
  trigger: eventTrigger({
    name: Events.ONBOARDING_EMAILS,
    schema: z.object({
      email: z.string().email(),
      fullName: z.string(),
    }),
  }),
  integrations: {
    resend,
  },
  run: async (payload, io, ctx) => {
    const id = ctx.event?.id as string;

    const unsubscribeLink = await generateUnsubscribeLink({
      id,
      type: "onboarding",
    });

    const isTestOrDev =
      ctx.run.isTest || ctx.environment.type === "DEVELOPMENT";

    const welcome = await io.resend.emails.send("welcome", {
      to: payload.email,
      subject: "Welcome to Midday",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        WelcomeEmail({
          fullName: payload.fullName,
          unsubscribeLink,
        })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-1", isTestOrDev ? 10 : 60 * 60 * 24); // 1 days

    const getStarted = await io.resend.emails.send("get-started", {
      to: payload.email,
      subject: "Get Started 1/6",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        GetStartedEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-2", isTestOrDev ? 10 : 60 * 60 * 24 * 5); // 5 days

    const financialOverview = await io.resend.emails.send(
      "financial-overview",
      {
        to: payload.email,
        subject: "Financial Overview 2/6",
        from: "Pontus from Midday <pontus@midday.ai>",
        html: await renderAsync(
          FinancialOverViewEmail({
            fullName: payload.fullName,
            unsubscribeLink,
          })
        ),
        headers: {
          "X-Entity-Ref-ID": nanoid(),
        },
      }
    );

    await io.wait("wait-3", isTestOrDev ? 10 : 60 * 60 * 24 * 10); // 10 days

    const magicInbox = await io.resend.emails.send("magic-inbox", {
      to: payload.email,
      subject: "Magic Inbox 3/6",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        InboxEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-4", isTestOrDev ? 10 : 60 * 60 * 24 * 15); // 15 days

    const preAccounting = await io.resend.emails.send("pre-accounting", {
      to: payload.email,
      subject: "Pre-Accounting 4/6",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        PreAccountingEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-5", isTestOrDev ? 10 : 60 * 60 * 24 * 20); // 20 days

    const vault = await io.resend.emails.send("vault", {
      to: payload.email,
      subject: "Store your files securely 5/6",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        VaultEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-6", isTestOrDev ? 10 : 60 * 60 * 24 * 25); // 25 days

    const timeTracker = await io.resend.emails.send("time-tracker", {
      to: payload.email,
      subject: "Time track your projects 6/6",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        TimeTrackEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    return {
      welcome,
      getStarted,
      financialOverview,
      magicInbox,
      preAccounting,
      vault,
      timeTracker,
    };
  },
});
