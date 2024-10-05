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
import { useState } from "react";

interface UpgradeTierProps {
  message?: string;
  initialOpen?: boolean;
}

export const UpgradeTier: React.FC<UpgradeTierProps> = ({
  message = "Please upgrade your tier to access detailed financial insights and analytics.",
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <h3 className="text-xl font-semibold mb-4">Upgrade Your Account</h3>
      <p className="text-center mb-6">{message}</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default">Upgrade Now</Button>
        </DialogTrigger>
        <DialogContent className="md:min-w-[30%] p-[5%]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              Business Tier Coming Soon
            </DialogTitle>
            <DialogDescription className="text-lg font-base text-foreground">
              Our new Business tier is currently in private beta. Our team is
              working hard to make it available to you soon.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-md text-foreground">
              If you'd like to be notified when the Business Tier becomes widely
              available, please send us an email below.
            </p>
            <p className="text-md text-bold underline">
              engineering@solomon-ai.co
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
