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
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";

interface ConnectWhatsAppProps {
  showTrigger?: boolean;
}

export function ConnectWhatsApp({ showTrigger = true }: ConnectWhatsAppProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Get the team's inbox ID
  const { data: team } = useQuery(trpc.team.current.queryOptions());

  // Check if WhatsApp is installed
  const { data: installedApps } = useQuery(trpc.apps.get.queryOptions());
  const whatsappApp = installedApps?.find((app) => app.app_id === "whatsapp");
  const isInstalled = !!whatsappApp;
  const connections = (whatsappApp?.config as any)?.connections || [];

  const disconnectMutation = useMutation(
    trpc.apps.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.apps.get.queryKey() });
      },
    }),
  );

  // WhatsApp number from environment
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const inboxId = team?.inboxId || "";
  const message = `Connect to Midday: ${inboxId}`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  useEffect(() => {
    if (open && inboxId && whatsappNumber) {
      generateQRCode();
    }
  }, [open, inboxId, whatsappNumber]);

  // Listen for open event from app store
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("openWhatsAppConnect", handleOpen);
    return () => window.removeEventListener("openWhatsAppConnect", handleOpen);
  }, []);

  const generateQRCode = async () => {
    if (!whatsappNumber) return;

    try {
      const url = await QRCode.toDataURL(whatsappUrl, {
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
      await navigator.clipboard.writeText(whatsappUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate({ appId: "whatsapp" });
  };

  // Don't render if WhatsApp number not configured
  if (!whatsappNumber) {
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
              <Icons.WhatsApp className="size-5 text-[#25D366]" />
              <span>WhatsApp ({connections.length} connected)</span>
            </div>
          </SubmitButton>
        ) : (
          <DialogTrigger asChild>
            <Button
              className="px-6 py-4 w-full font-medium h-[40px]"
              variant="outline"
            >
              <div className="flex items-center space-x-2">
                <Icons.WhatsApp className="size-5 text-[#25D366]" />
                <span>Connect WhatsApp</span>
              </div>
            </Button>
          </DialogTrigger>
        ))}

      <DialogContent className="sm:max-w-[400px] p-0" hideClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle>Connect WhatsApp</DialogTitle>
            <DialogDescription>
              Scan the QR code or open WhatsApp to connect your phone number.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col items-center space-y-4 p-6">
          <div className="size-[206px]">
            {qrCodeUrl ? (
              <div className="bg-white p-3 border">
                <img
                  src={qrCodeUrl}
                  alt="WhatsApp QR Code"
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
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Icons.WhatsApp className="mr-2 h-4 w-4 text-[#25D366]" />
                Open WhatsApp
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
            Just send the prefilled message to connect your number.
          </p>

          {connections.length > 0 && (
            <div className="w-full border-t pt-4">
              <p className="text-sm font-medium mb-2">Connected numbers:</p>
              <div className="space-y-2">
                {connections.map((connection: any) => (
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
