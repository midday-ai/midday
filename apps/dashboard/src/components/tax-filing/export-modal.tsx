"use client";

import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Label } from "@midday/ui/label";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

type ExportFormat = "pdf" | "csv" | "xlsx";
type AccountingFormat = "yayoi" | "freee" | "moneyforward";
type ReportType = "income_statement" | "balance_sheet" | "consumption_tax" | "full_report";

interface ExportModalProps {
  fiscalYear: number;
  onExport: (format: ExportFormat, reportType: ReportType) => Promise<void>;
  trigger?: React.ReactNode;
}

export function ExportModal({
  fiscalYear,
  onExport,
  trigger,
}: ExportModalProps) {
  const t = useI18n();
  const trpc = useTRPC();
  const [isOpen, setIsOpen] = useState(false);
  const [exportTab, setExportTab] = useState<"report" | "accounting">("report");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [accountingFormat, setAccountingFormat] = useState<AccountingFormat>("yayoi");
  const [reportType, setReportType] = useState<ReportType>("full_report");
  const [isExporting, setIsExporting] = useState(false);

  const exportToAccountingSoftware = useMutation({
    ...trpc.taxReports.exportToAccountingSoftware.mutationOptions(),
    onSuccess: () => {
      setIsOpen(false);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, reportType);
      setIsOpen(false);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountingExport = async () => {
    exportToAccountingSoftware.mutate({
      fiscalYear,
      format: accountingFormat,
      locale: "ja-JP",
    });
  };

  const formatOptions = [
    {
      value: "pdf" as const,
      label: t("tax_filing.actions.pdf"),
      description: t("tax_filing.actions.pdf_description"),
      icon: FileText,
    },
    {
      value: "csv" as const,
      label: t("tax_filing.actions.csv"),
      description: t("tax_filing.actions.csv_description"),
      icon: FileSpreadsheet,
    },
    {
      value: "xlsx" as const,
      label: t("tax_filing.actions.xlsx"),
      description: t("tax_filing.actions.xlsx_description"),
      icon: FileSpreadsheet,
    },
  ];

  const accountingFormatOptions = [
    {
      value: "yayoi" as const,
      label: t("tax_filing.export.formats.yayoi"),
      description: t("tax_filing.export.formats.yayoi_description"),
    },
    {
      value: "freee" as const,
      label: t("tax_filing.export.formats.freee"),
      description: t("tax_filing.export.formats.freee_description"),
    },
    {
      value: "moneyforward" as const,
      label: t("tax_filing.export.formats.moneyforward"),
      description: t("tax_filing.export.formats.moneyforward_description"),
    },
  ];

  const reportOptions = [
    {
      value: "full_report" as const,
      label: t("tax_filing.actions.full_report"),
      description: t("tax_filing.actions.full_report_description"),
    },
    {
      value: "income_statement" as const,
      label: t("tax_filing.sections.income_statement"),
      description: t("tax_filing.actions.income_statement_description"),
    },
    {
      value: "balance_sheet" as const,
      label: t("tax_filing.sections.balance_sheet"),
      description: t("tax_filing.actions.balance_sheet_description"),
    },
    {
      value: "consumption_tax" as const,
      label: t("tax_filing.sections.consumption_tax"),
      description: t("tax_filing.actions.consumption_tax_description"),
    },
  ];

  const isAccountingExporting = exportToAccountingSoftware.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t("tax_filing.actions.export")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("tax_filing.actions.export_title")}</DialogTitle>
          <DialogDescription>
            {t("tax_filing.actions.export_description", { year: fiscalYear })}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={exportTab} onValueChange={(v) => setExportTab(v as "report" | "accounting")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="report">{t("tax_filing.export.tab_report")}</TabsTrigger>
            <TabsTrigger value="accounting">{t("tax_filing.export.tab_accounting")}</TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="space-y-6 py-4">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <Label>{t("tax_filing.actions.select_report")}</Label>
              <RadioGroup
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
                className="space-y-2"
              >
                {reportOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                    onClick={() => setReportType(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="cursor-pointer font-medium">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Format Selection */}
            <div className="space-y-3">
              <Label>{t("tax_filing.actions.select_format")}</Label>
              <RadioGroup
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
                className="grid grid-cols-3 gap-3"
              >
                {formatOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex flex-col items-center space-y-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 ${
                      format === option.value ? "border-primary bg-muted/50" : ""
                    }`}
                    onClick={() => setFormat(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={`format-${option.value}`} className="sr-only" />
                    <option.icon className="h-6 w-6" />
                    <Label htmlFor={`format-${option.value}`} className="cursor-pointer text-xs">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t("tax_filing.actions.cancel")}
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("tax_filing.actions.generating")}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t("tax_filing.actions.download")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="accounting" className="space-y-6 py-4">
            <div className="rounded-lg bg-muted/50 p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                {t("tax_filing.export.accounting_description")}
              </p>
            </div>

            {/* Accounting Software Format Selection */}
            <div className="space-y-3">
              <Label>{t("tax_filing.export.format_label")}</Label>
              <RadioGroup
                value={accountingFormat}
                onValueChange={(value) => setAccountingFormat(value as AccountingFormat)}
                className="space-y-2"
              >
                {accountingFormatOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 ${
                      accountingFormat === option.value ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setAccountingFormat(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={`accounting-${option.value}`} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={`accounting-${option.value}`} className="cursor-pointer font-medium">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                {t("tax_filing.export.year_label")}: <strong>{fiscalYear}年度</strong>
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t("tax_filing.actions.cancel")}
              </Button>
              <Button onClick={handleAccountingExport} disabled={isAccountingExporting}>
                {isAccountingExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("tax_filing.export.exporting")}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t("tax_filing.export.download")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
