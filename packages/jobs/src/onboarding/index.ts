// import TransactionsEmail from "@midday/email/emails/transactions";
// import { renderAsync } from "@react-email/components";
// import { Resend } from "@trigger.dev/resend";
// import { client } from "../client";

// const resend = new Resend({
//   id: "resend",
//   apiKey: process.env.RESEND_API_KEY!,
// });

// client.defineJob({
//   id: "onboarding-emails",
//   name: "Onboarding Emails",
//   version: "1.0.0",
//   trigger: {},
//   integrations: {
//     resend,
//   },
//   run: async (payload, io, ctx) => {
//     if (!payload.record.email) {
//       return;
//     }

//     const isTestOrDev =
//       ctx.run.isTest || ctx.environment.type === "DEVELOPMENT";

//     const email1 = await io.resend.emails.send("welcome", {
//       to: payload.email,
//       subject: "Welcome to Midday",
//       from: "middaybot@midday.ai",
//       html: await renderAsync(TransactionsEmail({ fullName: "pontus" })),
//     });

//     await io.wait("wait-1", isTestOrDev ? 10 : 60 * 60 * 12); // 12 hours

//     const email2 = await io.resend.emails.send("email-2", {
//       to: payload.record.email,
//       subject: `Here are some tips to get started`,
//       from: process.env.RESEND_FROM_EMAIL!,
//     });

//     await io.wait("wait-2", isTestOrDev ? 10 : 60 * 60 * 24); // 24 hours

//     const email3 = await io.resend.emails.send("email-3", {
//       to: payload.record.email,
//       subject: "Do you have any questions?",
//       from: process.env.RESEND_FROM_EMAIL!,
//     });

//     return {
//       email1,
//       email2,
//       email3,
//     };
//   },
// });
