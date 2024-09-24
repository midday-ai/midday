import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { useState } from "react";

interface UpgradeTierProps {
  message?: string;
}

export const UpgradeTier: React.FC<UpgradeTierProps> = ({
  message = "Please upgrade your tier to access detailed financial insights and analytics.",
}) => {

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4">Upgrade Your Account</h3>
      <p className="text-center mb-6">{message}</p>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="default">Upgrade Now</Button>
        </DialogTrigger>
        <DialogContent className="md:min-w-[30%] p-[3%]">
          <DialogHeader>
            <DialogTitle>Business Tier Coming Soon</DialogTitle>
            <DialogDescription>
              Our new Business tier is currently in private beta. Our team is working hard to make it available to you
              soon. Sign up below to be notified when it launches.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-sm text-muted-foreground">
              If you'd like to be notified when the Business Tier becomes widely available, 
              please leave your email address with our support team.
            </p>
            <p className="text-sm text-muted-foreground">
              engineering@solomon-ai.co
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};