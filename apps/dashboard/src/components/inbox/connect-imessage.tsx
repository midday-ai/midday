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

interface ConnectIMessageProps {
  showTrigger?: boolean;
}

export function ConnectIMessage({ showTrigger = true }: ConnectIMessageProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [linkCode, setLinkCode] = useState("");

  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());
  const sendblueApp = installedApps?.find((app) => app.app_id === "sendblue");
  const connections = ((sendblueApp?.config as any)?.connections ||
    []) as Array<{
    phoneNumber: string;
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

  const sendblueNumber = process.env.NEXT_PUBLIC_SENDBLUE_NUMBER || "";
  const message = linkCode ? `Connect to Midday: ${linkCode}` : "";
  const smsUrl =
    sendblueNumber && message
      ? `sms:${sendblueNumber}?body=${encodeURIComponent(message)}`
      : "";
  const isReady = Boolean(smsUrl);

  useEffect(() => {
    if (!open || !sendblueNumber) {
      return;
    }

    createLinkTokenMutation
      .mutateAsync({ provider: "sendblue" })
      .catch(() => setLinkCode(""));
  }, [open, sendblueNumber]);

  useEffect(() => {
    if (!open || !smsUrl) {
      setQrCodeUrl("");
      return;
    }

    generateQRCode();
  }, [open, smsUrl]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openIMessageConnect", handleOpen);
    return () => window.removeEventListener("openIMessageConnect", handleOpen);
  }, []);

  const generateQRCode = async () => {
    if (!smsUrl) return;

    try {
      const url = await QRCode.toDataURL(smsUrl, {
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

  const copyToClipboard = async () => {
    try {
      if (!smsUrl) {
        return;
      }

      await navigator.clipboard.writeText(smsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!sendblueNumber) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            className="px-6 py-4 w-full font-medium h-[40px]"
            variant="outline"
          >
            <div className="flex items-center space-x-2">
              <Icons.IMessage className="size-5" />
              <span>
                {connections.length > 0
                  ? `iMessage (${connections.length} connected)`
                  : "Connect iMessage"}
              </span>
            </div>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[400px] p-0" hideClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Connect iMessage</DialogTitle>
            <DialogDescription>
              Scan the QR code or open Messages to connect your phone number.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="size-[206px]">
            {qrCodeUrl ? (
              <div className="bg-white p-3 border">
                <img
                  src={qrCodeUrl}
                  alt="iMessage QR Code"
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
              asChild={isReady}
              className="flex-1"
              variant="outline"
              disabled={!isReady}
            >
              {isReady ? (
                <a href={smsUrl}>
                  <Icons.IMessage className="mr-2 h-4 w-4" />
                  Open Messages
                </a>
              ) : (
                <span>
                  <Icons.IMessage className="mr-2 h-4 w-4" />
                  Open Messages
                </span>
              )}
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
            Just send the prefilled message to link this phone number to your
            Midday user.
          </p>

          {connections.length > 0 && (
            <div className="w-full border-t pt-4">
              <p className="text-sm font-medium mb-2">Connected numbers:</p>
              <div className="space-y-2">
                {connections.map((connection) => (
                  <div
                    key={connection.phoneNumber}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[#878787]">
                      +{connection.phoneNumber}
                    </span>
                    <span className="text-xs text-[#878787]">
                      {connection.displayName}
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
