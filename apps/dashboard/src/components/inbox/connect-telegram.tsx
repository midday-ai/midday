"use client";

import { useTRPC } from "@/trpc/client";
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
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface ConnectTelegramProps {
  showTrigger?: boolean;
}

export function ConnectTelegram({ showTrigger = true }: ConnectTelegramProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Get the team's inbox ID
  const { data: team } = useQuery(trpc.team.current.queryOptions());

  // Check if Telegram is installed
  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());
  const telegramApp = installedApps?.find((app) => app.app_id === "telegram");
  const isInstalled = !!telegramApp;
  const connections = (telegramApp?.config as any)?.connections || [];

  const disconnectMutation = useMutation(
    trpc.apps.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.apps.get.queryKey() });
      },
    }),
  );

  // Telegram bot username from environment
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";
  const inboxId = team?.inboxId || "";
  // Deep link that opens bot with start parameter (inbox ID)
  const telegramUrl = `https://t.me/${botUsername}?start=${inboxId}`;

  useEffect(() => {
    if (open && inboxId && botUsername) {
      generateQRCode();
    }
  }, [open, inboxId, botUsername]);

  // Listen for open event from app store
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openTelegramConnect", handleOpen);
    return () => window.removeEventListener("openTelegramConnect", handleOpen);
  }, []);

  const generateQRCode = async () => {
    if (!botUsername) return;

    try {
      const url = await QRCode.toDataURL(telegramUrl, {
        width: 200,
        margin: 0,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inboxId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate({ appId: "telegram" });
  };

  // Don't render if Telegram bot not configured
  if (!botUsername) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger &&
        (isInstalled ? (
          <SubmitButton
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
            onClick={handleDisconnect}
            isSubmitting={disconnectMutation.isPending}
          >
            <div className="flex items-center space-x-2">
              <Icons.Telegram className="size-5 text-[#0088cc]" />
              <span>Telegram ({connections.length} connected)</span>
            </div>
          </SubmitButton>
        ) : (
          <DialogTrigger asChild>
            <Button
              className="px-6 py-4 w-full font-medium h-[40px]"
              variant="outline"
            >
              <div className="flex items-center space-x-2">
                <Icons.Telegram className="size-5 text-[#0088cc]" />
                <span>Connect Telegram</span>
              </div>
            </Button>
          </DialogTrigger>
        ))}

      <DialogContent className="sm:max-w-[400px] p-0" hideClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Connect Telegram</DialogTitle>
            <DialogDescription>
              Scan the QR code or open Telegram to connect your account.
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
                <Icons.QrCode className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="w-full border-t" />

          <div className="flex gap-2 w-full">
            <Button asChild className="flex-1" variant="outline">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                <Icons.Telegram className="mr-2 h-4 w-4 text-[#0088cc]" />
                Open Telegram
              </a>
            </Button>
            <Button onClick={copyCode} variant="outline" className="flex-1">
              {copied ? (
                <>
                  <Icons.Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-[#878787]">
              Or message <span className="font-mono">@{botUsername}</span> with
              your code:
            </p>
            <p className="font-mono text-sm bg-muted px-3 py-1.5 rounded">
              {inboxId}
            </p>
          </div>

          {connections.length > 0 && (
            <div className="w-full border-t pt-4">
              <p className="text-sm font-medium mb-2">Connected accounts:</p>
              <div className="space-y-2">
                {connections.map((connection: any) => (
                  <div
                    key={connection.chatId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#878787]">
                      {connection.displayName || `Chat ${connection.chatId}`}
                    </span>
                    <span className="text-xs text-[#878787]">
                      {new Date(connection.connectedAt).toLocaleDateString()}
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
