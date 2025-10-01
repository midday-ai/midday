"use client";

import { exportTransactionsAction } from "@/actions/export-transactions-action";
import { useTeamMutation, useTeamQuery } from "@/hooks/use-team";
import { useUserQuery } from "@/hooks/use-user";
import { useExportStore } from "@/store/export";
import { useTransactionsStore } from "@/store/transactions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { Separator } from "@midday/ui/separator";
import { Spinner } from "@midday/ui/spinner";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import NumberFlow from "@number-flow/react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";

interface ExportSettings {
  csvDelimiter: string;
  includeCSV: boolean;
  includeXLSX: boolean;
  sendEmail: boolean;
  accountantEmail?: string;
}

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportTransactionsModal({
  isOpen,
  onOpenChange,
}: ExportTransactionsModalProps) {
  const { setExportData, setIsExporting } = useExportStore();
  const { rowSelection, setRowSelection } = useTransactionsStore();
  const { data: user } = useUserQuery();
  const { data: team } = useTeamQuery();
  const teamMutation = useTeamMutation();

  const ids = Object.keys(rowSelection);
  const totalSelected = ids.length;

  // Load saved settings from team
  const savedSettings = (team?.exportSettings as ExportSettings) || {
    csvDelimiter: ",",
    includeCSV: true,
    includeXLSX: true,
    sendEmail: false,
    accountantEmail: "",
  };

  const [settings, setSettings] = useState<ExportSettings>(savedSettings);
  const [activeTab, setActiveTab] = useState("manual");

  // Update settings when team data changes
  useEffect(() => {
    if (team?.exportSettings) {
      setSettings(team.exportSettings as ExportSettings);
    }
  }, [team?.exportSettings]);

  const { execute, status } = useAction(exportTransactionsAction, {
    onSuccess: ({ data }) => {
      if (data?.id && data?.publicAccessToken) {
        setExportData({
          runId: data.id,
          accessToken: data.publicAccessToken,
        });

        setRowSelection(() => ({}));
        setIsExporting(false);
      }

      onOpenChange(false);
    },
    onError: () => {
      setIsExporting(false);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);

    // Save settings to team
    // @ts-ignore - exportSettings is valid but types haven't regenerated yet
    await teamMutation.mutateAsync({
      exportSettings: settings,
    });

    execute({
      transactionIds: ids,
      dateFormat: user?.dateFormat ?? undefined,
      locale: user?.locale ?? undefined,
      exportSettings: settings,
    });
  };

  const handleSettingChange = (
    key: keyof ExportSettings,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isExporting = status === "executing";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* TabsList hidden until Connections feature is ready */}
            {/* <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
            </TabsList> */}

            <TabsContent value="manual" className="space-y-6">
              <DialogHeader className="mb-8">
                <DialogTitle>Export Transactions</DialogTitle>
                <DialogDescription>
                  Export <NumberFlow value={totalSelected} /> selected
                  transactions with your preferred settings. You'll be notified
                  when ready.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">CSV</Label>
                    <p className="text-xs text-[#878787]">
                      Export as comma-separated values
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeCSV}
                    onCheckedChange={(checked) =>
                      handleSettingChange("includeCSV", checked)
                    }
                  />
                </div>

                {/* CSV Settings Accordion - Only shown when CSV is enabled */}
                {settings.includeCSV && (
                  <Accordion type="single" collapsible className="-mx-4">
                    <AccordionItem value="csv-settings" className="border-0">
                      <AccordionTrigger className="py-3 px-4 hover:no-underline hover:bg-accent/50">
                        <span className="text-sm text-[#878787]">
                          CSV Settings
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4">
                        <div className="space-y-2 pt-2">
                          <Label htmlFor="delimiter" className="text-sm">
                            Delimiter
                          </Label>
                          <RadioGroup
                            value={settings.csvDelimiter}
                            onValueChange={(value) =>
                              handleSettingChange("csvDelimiter", value)
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="," id="comma" />
                              <Label
                                htmlFor="comma"
                                className="text-sm font-normal"
                              >
                                Comma (,)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value=";" id="semicolon" />
                              <Label
                                htmlFor="semicolon"
                                className="text-sm font-normal"
                              >
                                Semicolon (;)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="\t" id="tab" />
                              <Label
                                htmlFor="tab"
                                className="text-sm font-normal"
                              >
                                Tab
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">Excel (XLSX)</Label>
                    <p className="text-xs text-[#878787]">
                      Export as Excel spreadsheet
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeXLSX}
                    onCheckedChange={(checked) =>
                      handleSettingChange("includeXLSX", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">
                      Send via email
                    </Label>
                    <p className="text-xs text-[#878787]">
                      Email the export to your accountant
                    </p>
                  </div>
                  <Switch
                    checked={settings.sendEmail}
                    onCheckedChange={(checked) =>
                      handleSettingChange("sendEmail", checked)
                    }
                  />
                </div>

                {settings.sendEmail && (
                  <div className="space-y-2">
                    <Input
                      id="accountantEmail"
                      type="email"
                      placeholder="accountant@example.com"
                      value={settings.accountantEmail || ""}
                      onChange={(e) =>
                        handleSettingChange("accountantEmail", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={
                    isExporting ||
                    (!settings.includeCSV && !settings.includeXLSX) ||
                    (settings.sendEmail && !settings.accountantEmail)
                  }
                >
                  {isExporting ? (
                    <div className="flex items-center space-x-2">
                      <Spinner className="size-4" />
                      <span>Exporting...</span>
                    </div>
                  ) : (
                    <span>Export</span>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
