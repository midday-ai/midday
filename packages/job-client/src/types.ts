/**
 * Job type definitions for type-safe job enqueueing
 */

// Inbox job types
export interface EmbedInboxJob {
  name: "embed-inbox";
  data: {
    inboxId: string;
    teamId: string;
  };
}

export interface BatchProcessMatchingJob {
  name: "batch-process-matching";
  data: {
    teamId: string;
    inboxIds: string[];
  };
}

export interface MatchTransactionsBidirectionalJob {
  name: "match-transactions-bidirectional";
  data: {
    teamId: string;
    newTransactionIds: string[];
  };
}

export interface ProcessAttachmentJob {
  name: "process-attachment";
  data: {
    teamId: string;
    mimetype: string;
    size: number;
    filePath: string[];
    referenceId?: string;
    website?: string;
    senderEmail?: string;
    inboxAccountId?: string;
  };
}

// Transaction job types
export interface ExportTransactionsJob {
  name: "export-transactions";
  data: {
    teamId: string;
    userId: string;
    locale: string;
    dateFormat?: string | null;
    transactionIds: string[];
    exportSettings?: {
      csvDelimiter: string;
      includeCSV: boolean;
      includeXLSX: boolean;
      sendEmail: boolean;
      accountantEmail?: string;
    };
  };
}

export interface ProcessExportJob {
  name: "process-export";
  data: {
    ids: string[];
    locale: string;
    dateFormat?: string | null;
  };
}

export type InboxJob =
  | EmbedInboxJob
  | BatchProcessMatchingJob
  | MatchTransactionsBidirectionalJob
  | ProcessAttachmentJob;

export type TransactionJob = ExportTransactionsJob | ProcessExportJob;

export type Job = InboxJob | TransactionJob;
