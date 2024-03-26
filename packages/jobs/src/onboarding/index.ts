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

    await io.wait("wait-1", isTestOrDev ? 10 : 60 * 60 * 24); // 1 day

    const getStarted = await io.resend.emails.send("get-started", {
      to: payload.email,
      subject: "Get Started",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        GetStartedEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-2", isTestOrDev ? 10 : 60 * 60 * 24 * 2); // 2 day

    const financialOverview = await io.resend.emails.send(
      "financial-overview",
      {
        to: payload.email,
        subject: "Financial Overview",
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

    await io.wait("wait-3", isTestOrDev ? 10 : 60 * 60 * 24 * 3); // 3 day

    const magicInbox = await io.resend.emails.send("magic-inbox", {
      to: payload.email,
      subject: "Magic Inbox",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        InboxEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-4", isTestOrDev ? 10 : 60 * 60 * 24 * 4); // 4 day

    const preAccounting = await io.resend.emails.send("pre-accounting", {
      to: payload.email,
      subject: "Pre-Accounting",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        PreAccountingEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-5", isTestOrDev ? 10 : 60 * 60 * 24 * 5); // 5 day

    const vault = await io.resend.emails.send("vault", {
      to: payload.email,
      subject: "Store your files securely",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await renderAsync(
        VaultEmail({ fullName: payload.fullName, unsubscribeLink })
      ),
      headers: {
        "X-Entity-Ref-ID": nanoid(),
      },
    });

    await io.wait("wait-6", isTestOrDev ? 10 : 60 * 60 * 24 * 6); // 6 day

    const timeTracker = await io.resend.emails.send("time-tracker", {
      to: payload.email,
      subject: "Time track your projects",
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
