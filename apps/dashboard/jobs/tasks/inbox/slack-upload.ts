// import { createSlackWebClient, downloadFile } from "@midday/app-store/slack";
// import { DocumentClient, prepareDocument } from "@midday/documents";
// import { eventTrigger } from "@trigger.dev/sdk";
// import { format } from "date-fns";
// import { z } from "zod";
// import { client, supabase } from "../client";
// import { Events, Jobs } from "../constants";

// const concurrencyLimit = client.defineConcurrencyLimit({
//   id: "inbox-slack-upload",
//   limit: 25,
// });

// client.defineJob({
//   id: Jobs.INBOX_SLACK_UPLOAD,
//   name: "Inbox - Slack Upload",
//   version: "0.0.1",
//   concurrencyLimit,
//   trigger: eventTrigger({
//     name: Events.INBOX_SLACK_UPLOAD,
//     schema: z.object({
//       teamId: z.string(),
//       token: z.string(),
//       channelId: z.string(),
//       threadId: z.string().optional(),
//       file: z.object({
//         id: z.string(),
//         name: z.string(),
//         mimetype: z.string(),
//         size: z.number(),
//         url: z.string(),
//       }),
//     }),
//   }),
//   integrations: {
//     supabase,
//   },
//   run: async (payload, io) => {
//     const {
//       teamId,
//       token,
//       channelId,
//       threadId,
//       file: { id, name, mimetype, size, url },
//     } = payload;

//     const slackApp = createSlackWebClient({
//       token,
//     });

//     if (threadId) {
//       await slackApp.assistant.threads.setStatus({
//         channel_id: channelId,
//         thread_ts: threadId,
//         status: "Is thinking...",
//       });
//     }

//     const fileData = await downloadFile({
//       privateDownloadUrl: url,
//       token,
//     });

//     if (!fileData) {
//       throw Error("No file data");
//     }

//     const document = await prepareDocument({
//       Content: Buffer.from(fileData).toString("base64"),
//       ContentType: mimetype,
//       ContentLength: size,
//       Name: name,
//     });

//     const pathTokens = [teamId, "inbox", document.fileName];

//     // Upload file to vault
//     await io.supabase.client.storage
//       .from("vault")
//       .upload(pathTokens.join("/"), new Uint8Array(document.content), {
//         contentType: document.mimeType,
//         upsert: true,
//       });

//     const { data: inboxData } = await io.supabase.client
//       .from("inbox")
//       .insert({
//         // NOTE: If we can't parse the name using OCR this will be the fallback name
//         display_name: document.name,
//         team_id: teamId,
//         file_path: pathTokens,
//         file_name: document.fileName,
//         content_type: document.mimeType,
//         reference_id: `${id}_${document.fileName}`,
//         size,
//       })
//       .select("*")
//       .single()
//       .throwOnError();

//     try {
//       const document = new DocumentClient({
//         contentType: inboxData?.content_type,
//       });

//       const result = await document.getDocument({
//         content: Buffer.from(fileData).toString("base64"),
//       });

//       const { data: updatedInbox } = await io.supabase.client
//         .from("inbox")
//         .update({
//           amount: result.amount,
//           currency: result.currency,
//           display_name: result.name,
//           website: result.website,
//           date: result.date && new Date(result.date),
//           type: result.type,
//           description: result.description,
//           status: "pending",
//         })
//         .eq("id", inboxData.id)
//         .select()
//         .single();

//       if (updatedInbox?.amount) {
//         // Send notification to slack
//         try {
//           await slackApp.chat.postMessage({
//             channel: channelId,
//             thread_ts: threadId,
//             unfurl_links: false,
//             unfurl_media: false,
//             blocks: [
//               {
//                 type: "section",
//                 text: {
//                   type: "mrkdwn",
//                   text: `Here's the information I extracted from your receipt:\n\n• *Vendor:* ${updatedInbox.display_name}\n• *Amount:* ${new Intl.NumberFormat(
//                     "en-US",
//                     {
//                       style: "currency",
//                       currency: updatedInbox.currency,
//                     },
//                   ).format(
//                     updatedInbox.amount,
//                   )}\n• *Date:* ${updatedInbox.date ? format(new Date(updatedInbox.date), "MMM d") : ""}\n\nWe'll notify you when we match it to a transaction.`,
//                 },
//               },
//               {
//                 type: "actions",
//                 elements: [
//                   {
//                     type: "button",
//                     text: {
//                       type: "plain_text",
//                       text: "Show receipt",
//                       emoji: true,
//                     },
//                     url: `https://app.midday.ai/inbox?id=${encodeURIComponent(updatedInbox.id)}`,
//                     action_id: "view_receipt",
//                   },
//                 ],
//               },
//             ],
//           });

//           if (threadId) {
//             await slackApp.assistant.threads.setStatus({
//               channel_id: channelId,
//               thread_ts: threadId,
//               status: "",
//             });
//           }
//         } catch (err) {
//           console.error(err);
//         }

//         // TODO: Send event to match inbox
//       }
//     } catch {
//       // If we end up here we could not parse the document
//       // But we want to update the status so we show the record with fallback name
//       await io.supabase.client
//         .from("inbox")
//         .update({ status: "pending" })
//         .eq("id", inboxData.id);

//       if (threadId) {
//         await slackApp.assistant.threads.setStatus({
//           channel_id: channelId,
//           thread_ts: threadId,
//           status: "",
//         });
//       }
//     }
//   },
// });
