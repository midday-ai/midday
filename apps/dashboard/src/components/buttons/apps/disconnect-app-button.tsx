"use client";
import { disconnectAppAction } from "@/actions/disconnect-app-action";
import { Button } from "@/components/ui/button";
import { Loader2, PowerOff } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import React from "react";

interface DisconnectAppButtonProps {
  appId: string;
  appName: string;
}

const DisconnectAppButton: React.FC<DisconnectAppButtonProps> = ({
  appId,
  appName,
}) => {
  const disconnectApp = useAction(disconnectAppAction);

  const handleDisconnect = () => {
    disconnectApp.execute({ appId: appId });
  };

  return (
    <Button
      variant="destructive"
      size="lg"
      onClick={handleDisconnect}
      disabled={disconnectApp.status === "executing"}
    >
      {disconnectApp.status === "executing" ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Disconnecting...
        </>
      ) : (
        <>
          <PowerOff className="mr-2 h-4 w-4" />
          Disconnect {appName}
        </>
      )}
    </Button>
  );
};

export default DisconnectAppButton;
