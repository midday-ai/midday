export class ReportNotFoundError extends Error {
  code = "REPORT_NOT_FOUND" as const;

  constructor() {
    super("Report not found");
    this.name = "ReportNotFoundError";
  }
}

export class ReportExpiredError extends Error {
  code = "REPORT_EXPIRED" as const;

  constructor() {
    super("Report has expired");
    this.name = "ReportExpiredError";
  }
}

export class InvalidReportTypeError extends Error {
  code = "INVALID_REPORT_TYPE" as const;

  constructor() {
    super("Invalid report type");
    this.name = "InvalidReportTypeError";
  }
}
