"use client";

import { useUserQuery } from "@/hooks/use-user";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useState } from "react";
import { WhatsAppModal } from "./whatsapp-modal";

export function ConnectWhatsApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: user } = useUserQuery();

  const handleConnect = () => {
    setIsModalOpen(true);
  };

  if (!user?.team?.inboxId) {
    return null;
  }

  return (
    <>
      <SubmitButton
        className="px-6 py-4 w-full font-medium h-[40px]"
        variant="outline"
        onClick={handleConnect}
        isSubmitting={false}
      >
        <div className="flex items-center space-x-2">
          <Icons.WhatsApp className="size-[19px]" />
          <span>Connect WhatsApp</span>
        </div>
      </SubmitButton>

      <WhatsAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inboxId={user.team.inboxId}
      />
    </>
  );
}
