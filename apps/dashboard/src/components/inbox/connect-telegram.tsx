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

  const telegramBotUsername =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const telegramUrl =
    telegramBotUsername && linkCode
      ? `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(linkCode)}`
      : "";

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
    try {
      await navigator.clipboard.writeText(telegramUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
          >
            <div className="flex items-center space-x-2">
              <TelegramIcon />
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
            <Button asChild className="flex-1" variant="outline">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                <TelegramIcon className="mr-2 h-4 w-4" />
                Open Telegram
              </a>
            </Button>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1"
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

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      className={className}
      width="20"
      height="20"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="120" fill="#229ED9" />
      <path
        d="M54.3 118.8c35-15.3 58.3-25.3 69.7-30.2c32.5-13.5 39.3-15.8 43.7-15.9c1 0 3.1.2 4.6 1.4c1.2 1 1.6 2.3 1.8 3.2c.2 1 .4 3.2.2 4.9c-2.1 19.8-10.1 67.8-14.2 89.9c-1.8 9.3-5.2 12.5-8.6 12.8c-7.3.7-12.9-4.8-19.9-9.4c-11-7.2-17.2-11.7-27.8-18.7c-12.2-8.1-4.3-12.5 2.7-19.8c1.8-1.9 33.2-30.4 33.8-33c.1-.3.1-1.6-.7-2.3s-2-.4-2.8-.2c-1.2.3-20 12.7-56.5 37.1c-5.3 3.6-10.2 5.3-14.6 5.2c-4.8-.1-14.1-2.7-21.1-4.9c-8.5-2.8-15.2-4.2-14.6-8.9c.3-2.4 3.7-4.8 10-7.3Z"
        fill="white"
      />
      <path
        d="M93.4 161.1c-4.2 0-3.5-1.6-5-5.6l-12.6-41.4l96.8-57.4"
        fill="#C8DAEA"
      />
    </svg>
  );
}
