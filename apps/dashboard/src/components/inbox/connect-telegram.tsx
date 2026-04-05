"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useConnectDialogReset } from "./use-connect-dialog";

interface ConnectTelegramProps {
  showTrigger?: boolean;
}

export function ConnectTelegram({ showTrigger = true }: ConnectTelegramProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState("");

  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());

  const telegramApp = installedApps?.find((app) => app.app_id === "telegram");
  const connections = ((telegramApp?.config as any)?.connections ||
    []) as Array<{
    userId: string;
    username?: string;
    displayName?: string;
  }>;

  const createLinkTokenMutation = useMutation(
    trpc.apps.createPlatformLinkToken.mutationOptions({
      onSuccess: (token) => {
        setLinkCode(token.code);
      },
    }),
  );

  const handleOpenChange = useConnectDialogReset({
    setOpen,
    setLinkCode,
    setQrCodeUrl,
    setCopied,
    resetMutation: () => createLinkTokenMutation.reset(),
  });

  const telegramBotUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const telegramUrl =
    telegramBotUsername && linkCode
      ? `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(linkCode)}`
      : "";
  const isTelegramReady = Boolean(telegramUrl);

  useEffect(() => {
    if (!open || !telegramBotUsername) {
      return;
    }

    createLinkTokenMutation
      .mutateAsync({ provider: "telegram" })
      .catch(() => setLinkCode(""));
  }, [open, telegramBotUsername]);

  useEffect(() => {
    if (!open || !telegramUrl) return;

    QRCode.toDataURL(telegramUrl, {
      width: 200,
      margin: 0,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(""));
  }, [open, telegramUrl]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openTelegramConnect", handleOpen);
    return () => window.removeEventListener("openTelegramConnect", handleOpen);
  }, []);

  if (!telegramBotUsername) {
    return null;
  }

  const copyToClipboard = async () => {
    if (!telegramUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(telegramUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
          >
            <div className="flex items-center space-x-2">
              <Icons.Telegram className="size-5" />
              <span>
                {connections.length > 0
                  ? `Telegram (${connections.length} connected)`
                  : "Connect Telegram"}
              </span>
            </div>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[400px] p-0" hideClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Connect Telegram</DialogTitle>
            <DialogDescription>
              Scan the QR code or open Telegram to start the Midday bot with
              your workspace connection code.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="size-[206px]">
            {qrCodeUrl ? (
              <div className="bg-white p-3 border">
                <img
                  src={qrCodeUrl}
                  alt="Telegram QR Code"
                  className="w-[180px] h-[180px]"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-[180px] h-[180px] border border-dashed border-border">
                {createLinkTokenMutation.isPending ? (
                  <Spinner className="h-10 w-10 animate-spin text-muted-foreground" />
                ) : (
                  <Icons.QrCode className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            )}
          </div>

          <div className="w-full border-t" />

          <div className="flex gap-2 w-full">
            <Button
              asChild={isTelegramReady}
              className="flex-1"
              variant="outline"
              disabled={!isTelegramReady}
            >
              {isTelegramReady ? (
                <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Icons.Telegram className="mr-2 h-4 w-4" />
                  Open Telegram
                </a>
              ) : (
                <span>
                  <Icons.Telegram className="mr-2 h-4 w-4" />
                  Open Telegram
                </span>
              )}
            </Button>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1"
              disabled={!telegramUrl}
            >
              {copied ? (
                <>
                  <Icons.Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[#878787] text-center">
            Telegram opens the bot with a one-time code that links this account
            to your Midday user.
          </p>

          {connections.length > 0 && (
            <div className="w-full border-t pt-4">
              <p className="text-sm font-medium mb-2">Connected accounts:</p>
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection.userId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#878787]">
                      {connection.displayName || connection.username || "User"}
                    </span>
                    <span className="text-xs text-[#878787]">
                      {connection.username ? `@${connection.username}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
