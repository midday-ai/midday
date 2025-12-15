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

export class WhatsAppAlreadyConnectedToAnotherTeamError extends Error {
  code = "WHATSAPP_ALREADY_CONNECTED_TO_ANOTHER_TEAM" as const;

  constructor() {
    super("Phone number already connected to another team");
    this.name = "WhatsAppAlreadyConnectedToAnotherTeamError";
  }
}
