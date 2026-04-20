import { PassThrough } from "node:stream";
import { writeToString } from "@fast-csv/format";
import {
  getCustomers,
  getDocuments,
  getDocumentTags,
  getInbox,
  getInvoiceRecurringList,
  getInvoices,
  getTags,
  getTeamById,
  getTrackerProjects,
  getTrackerRecordsByRange,
  getTransactions,
  updateDocumentByPath,
} from "@midday/db/queries";
import { createClient } from "@midday/supabase/job";
import { download } from "@midday/supabase/storage";
import archiver from "archiver";
import type { Job } from "bullmq";
import { format, formatISO } from "date-fns";
import type { ExportTeamDataPayload } from "../../schemas/transactions";
import { getDb } from "../../utils/db";
import { TIMEOUTS, withTimeout } from "../../utils/timeout";
import { BaseProcessor } from "../base";
import { ProcessExportProcessor } from "./process-export";

const TX_BATCH = 100;
const PAGE = 200;

function flattenForCsv(
  rows: Record<string, unknown>[],
): Record<string, string>[] {
  return rows.map((row) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined) {
        o[k] = "";
      } else if (typeof v === "object") {
        o[k] = JSON.stringify(v);
      } else {
        o[k] = String(v);
      }
    }
    return o;
  });
}

async function rowsToCsv(rows: Record<string, unknown>[]): Promise<string> {
  if (rows.length === 0) {
    return "";
  }
  return writeToString(flattenForCsv(rows), { headers: true });
}

export class ExportTeamDataProcessor extends BaseProcessor<ExportTeamDataPayload> {
  async process(job: Job<ExportTeamDataPayload>): Promise<{
    filePath: string;
    fullPath: string;
    fileName: string;
    totalItems: number;
  }> {
    const { teamId, locale, dateFormat } = job.data;
    const resolvedLocale = locale ?? "en";
    const supabase = createClient();
    const db = getDb();

    const filePath = `team-export-${format(new Date(), `${dateFormat ?? "yyyy-MM-dd"}-HHmm`)}`;
    const exportDir = `${teamId}/exports`;
    const fileName = `${filePath}.zip`;

    const files: Array<{ name: string; data: Buffer }> = [];
    let totalItems = 0;

    await this.updateProgress(job, 2);

    // --- Transactions (CSV + attachments) ---
    const transactionIds: string[] = [];
    let cursor: string | null | undefined;
    do {
      const page = await getTransactions(db, {
        teamId,
        cursor,
        pageSize: PAGE,
      });
      for (const row of page.data) {
        transactionIds.push(row.id);
      }
      cursor = page.meta.hasNextPage ? page.meta.cursor : undefined;
    } while (cursor);

    const processExportProcessor = new ProcessExportProcessor();
    const allRows: unknown[][] = [];
    const allAttachments: Array<{
      id: string;
      name: string;
      blob: Blob | undefined;
    }> = [];

    const txProgressStart = 5;
    const txProgressEnd = 45;
    const txBatches = Math.max(1, Math.ceil(transactionIds.length / TX_BATCH));
    let b = 0;
    for (let i = 0; i < transactionIds.length; i += TX_BATCH) {
      const batch = transactionIds.slice(i, i + TX_BATCH);
      const result = await processExportProcessor.processTransactions({
        ids: batch,
        teamId,
        locale: resolvedLocale,
        dateFormat,
        onProgress: async (p) => {
          const batchBase =
            txProgressStart +
            (b / txBatches) * (txProgressEnd - txProgressStart);
          const sub =
            (p / 100) * ((1 / txBatches) * (txProgressEnd - txProgressStart));
          await this.updateProgress(job, Math.round(batchBase + sub));
        },
      });
      allRows.push(...result.rows);
      allAttachments.push(...result.attachments);
      b++;
    }

    const columns = [
      "ID",
      "Date",
      "Description",
      "Additional info",
      "Amount",
      "Currency",
      "Formatted amount",
      "Base amount",
      "Base currency",
      "Tax type",
      "Tax rate",
      "Tax amount",
      "Base tax amount",
      "From / To",
      "Category",
      "Category description",
      "Tax reporting code",
      "Status",
      "Attachments",
      "Balance",
      "Account",
      "Note",
      "Tags",
    ];
    const idColumnIndex = 0;
    const amountColumnIndex = 4;
    const transactionTypeMap = new Map<string, "expense" | "income">();
    for (const row of allRows) {
      const transactionId = row[idColumnIndex] as string;
      const amount = row[amountColumnIndex] as number;
      transactionTypeMap.set(transactionId, amount < 0 ? "expense" : "income");
    }

    const sortedRows = allRows.sort((a, b) => {
      const dateA = new Date(a[1] as string).getTime();
      const dateB = new Date(b[1] as string).getTime();
      return Number.isNaN(dateA) || Number.isNaN(dateB) ? 0 : dateB - dateA;
    });

    if (sortedRows.length > 0) {
      const csv = await writeToString(sortedRows, {
        headers: columns,
        delimiter: ",",
      });
      files.push({
        name: "transactions.csv",
        data: Buffer.from(csv, "utf-8"),
      });
    } else {
      files.push({
        name: "transactions.csv",
        data: Buffer.from(`${columns.join(",")}\n`, "utf-8"),
      });
    }
    totalItems += sortedRows.length;

    for (const attachment of allAttachments) {
      if (!attachment.blob) continue;
      try {
        const arrayBuffer = await attachment.blob.arrayBuffer();
        const transactionType =
          transactionTypeMap.get(attachment.id) ?? "expense";
        const attachmentPath = `attachments/${transactionType}/${attachment.name}`;
        files.push({
          name: attachmentPath,
          data: Buffer.from(arrayBuffer),
        });
      } catch (error) {
        this.logger.warn("Failed to add transaction attachment to zip", {
          error,
          attachmentName: attachment.name,
        });
      }
    }

    await this.updateProgress(job, 48);

    // --- Invoices ---
    const invoiceRows: Record<string, unknown>[] = [];
    let invCursor: string | null | undefined;
    do {
      const page = await getInvoices(db, {
        teamId,
        cursor: invCursor,
        pageSize: PAGE,
      });
      invoiceRows.push(...page.data);
      invCursor = page.meta.hasNextPage
        ? (page.meta.cursor ?? undefined)
        : undefined;
    } while (invCursor);

    files.push({
      name: "invoices.csv",
      data: Buffer.from(await rowsToCsv(invoiceRows), "utf-8"),
    });
    totalItems += invoiceRows.length;

    for (const inv of invoiceRows) {
      const fp = inv.filePath as string[] | null | undefined;
      const num = inv.invoiceNumber as string | undefined;
      if (!fp?.length || !num) continue;
      const storagePath = fp.join("/");
      try {
        const { data } = await download(supabase, {
          bucket: "vault",
          path: storagePath,
        });
        if (data) {
          const buf = Buffer.from(await data.arrayBuffer());
          files.push({
            name: `invoices/${num}.pdf`,
            data: buf,
          });
        }
      } catch (error) {
        this.logger.warn("Failed to add invoice PDF to zip", {
          error,
          invoiceNumber: num,
        });
      }
    }

    await this.updateProgress(job, 58);

    // --- Invoice recurring ---
    const recurringRows: Record<string, unknown>[] = [];
    let recCursor: string | null | undefined;
    do {
      const page = await getInvoiceRecurringList(db, {
        teamId,
        cursor: recCursor,
        pageSize: PAGE,
      });
      recurringRows.push(...page.data);
      recCursor = page.meta.hasNextPage
        ? (page.meta.cursor ?? undefined)
        : undefined;
    } while (recCursor);
    files.push({
      name: "invoice-recurring.csv",
      data: Buffer.from(await rowsToCsv(recurringRows), "utf-8"),
    });
    totalItems += recurringRows.length;

    await this.updateProgress(job, 62);

    // --- Customers ---
    const customerRows: Record<string, unknown>[] = [];
    let custCursor: string | null | undefined;
    do {
      const page = await getCustomers(db, {
        teamId,
        cursor: custCursor,
        pageSize: PAGE,
      });
      customerRows.push(...page.data);
      custCursor = page.meta.hasNextPage
        ? (page.meta.cursor ?? undefined)
        : undefined;
    } while (custCursor);
    files.push({
      name: "customers.csv",
      data: Buffer.from(await rowsToCsv(customerRows), "utf-8"),
    });
    totalItems += customerRows.length;

    await this.updateProgress(job, 66);

    // --- Tracker projects ---
    const projectRows: Record<string, unknown>[] = [];
    let projCursor: string | null | undefined;
    do {
      const page = await getTrackerProjects(db, {
        teamId,
        cursor: projCursor,
        pageSize: PAGE,
      });
      projectRows.push(...page.data);
      projCursor = page.meta.hasNextPage
        ? (page.meta.cursor ?? undefined)
        : undefined;
    } while (projCursor);
    files.push({
      name: "tracker-projects.csv",
      data: Buffer.from(await rowsToCsv(projectRows), "utf-8"),
    });
    totalItems += projectRows.length;

    await this.updateProgress(job, 70);

    // --- Tracker entries ---
    const trackerRange = await getTrackerRecordsByRange(db, {
      teamId,
      from: "2000-01-01",
      to: formatISO(new Date()),
    });
    const flatTrackerEntries = Object.values(trackerRange.result).flat();
    files.push({
      name: "tracker-entries.csv",
      data: Buffer.from(
        await rowsToCsv(flatTrackerEntries as Record<string, unknown>[]),
        "utf-8",
      ),
    });
    totalItems += flatTrackerEntries.length;

    await this.updateProgress(job, 74);

    // --- Vault documents ---
    const docMeta: Record<string, unknown>[] = [];
    let docCursor: string | null | undefined;
    do {
      const page = await getDocuments(db, {
        teamId,
        cursor: docCursor,
        pageSize: PAGE,
      });
      for (const doc of page.data) {
        docMeta.push({
          id: doc.id,
          name: doc.name,
          title: doc.title,
          summary: doc.summary,
          date: doc.date,
          metadata: doc.metadata,
          pathTokens: doc.pathTokens,
          processingStatus: doc.processingStatus,
          createdAt: doc.createdAt,
          documentTagAssignments: doc.documentTagAssignments,
        });
        const tokens = doc.pathTokens;
        if (tokens?.length) {
          const storagePath = tokens.join("/");
          const safeName = tokens.join("_").replace(/[/\\?%*:|"<>]/g, "_");
          try {
            const { data } = await download(supabase, {
              bucket: "vault",
              path: storagePath,
            });
            if (data) {
              files.push({
                name: `documents/${safeName}`,
                data: Buffer.from(await data.arrayBuffer()),
              });
            }
          } catch (error) {
            this.logger.warn("Failed to add vault file to zip", {
              error,
              path: storagePath,
            });
          }
        }
      }
      docCursor = page.meta.hasNextPage
        ? (page.meta.cursor ?? undefined)
        : undefined;
    } while (docCursor);
    files.push({
      name: "documents.csv",
      data: Buffer.from(await rowsToCsv(docMeta), "utf-8"),
    });
    totalItems += docMeta.length;

    await this.updateProgress(job, 82);

    // --- Inbox (financial + other tab) ---
    const inboxRows: Record<string, unknown>[] = [];
    const seenInboxIds = new Set<string>();
    for (const tab of [undefined, "other" as const]) {
      let inCursor: string | null | undefined;
      do {
        const page = await getInbox(db, {
          teamId,
          cursor: inCursor,
          pageSize: PAGE,
          tab,
        });
        for (const row of page.data) {
          if (seenInboxIds.has(row.id)) continue;
          seenInboxIds.add(row.id);
          inboxRows.push(row);
        }
        inCursor = page.meta.hasNextPage
          ? (page.meta.cursor ?? undefined)
          : undefined;
      } while (inCursor);
    }
    files.push({
      name: "inbox.csv",
      data: Buffer.from(await rowsToCsv(inboxRows), "utf-8"),
    });
    totalItems += inboxRows.length;

    for (const item of inboxRows) {
      const fp = item.filePath as string[] | null | undefined;
      const fn = (item.fileName as string | null) ?? "file";
      if (!fp?.length) continue;
      const storagePath = fp.join("/");
      const safeFn = fn.replace(/[/\\?%*:|"<>]/g, "_");
      try {
        const { data } = await download(supabase, {
          bucket: "vault",
          path: storagePath,
        });
        if (data) {
          files.push({
            name: `inbox/${item.id}_${safeFn}`,
            data: Buffer.from(await data.arrayBuffer()),
          });
        }
      } catch (error) {
        this.logger.warn("Failed to add inbox file to zip", {
          error,
          path: storagePath,
        });
      }
    }

    await this.updateProgress(job, 88);

    // --- Tags + team snapshot ---
    const transactionTags = await getTags(db, { teamId });
    const documentTags = await getDocumentTags(db, teamId);
    files.push({
      name: "tags.json",
      data: Buffer.from(
        JSON.stringify({ transactionTags, documentTags }, null, 2),
        "utf-8",
      ),
    });

    const team = await getTeamById(db, teamId);
    files.push({
      name: "team.json",
      data: Buffer.from(JSON.stringify(team, null, 2), "utf-8"),
    });

    await this.updateProgress(job, 92);

    const zip = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = new PassThrough();
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", reject);
      archive.pipe(stream);
      for (const file of files) {
        archive.append(file.data, { name: file.name });
      }
      archive.finalize();
    });

    const fullPath = `${exportDir}/${fileName}`;
    const { error: uploadError } = await withTimeout(
      supabase.storage.from("vault").upload(fullPath, zip, {
        upsert: true,
        contentType: "application/zip",
      }),
      TIMEOUTS.FILE_UPLOAD,
      `File upload timed out after ${TIMEOUTS.FILE_UPLOAD}ms`,
    );

    if (uploadError) {
      throw new Error(`Failed to upload export file: ${uploadError.message}`);
    }

    await this.updateProgress(job, 96);

    const pathTokens = fullPath.split("/");
    await updateDocumentByPath(db, {
      pathTokens,
      teamId,
      processingStatus: "completed",
    });

    await this.updateProgress(job, 100);

    return {
      filePath,
      fullPath,
      fileName,
      totalItems,
    };
  }
}
