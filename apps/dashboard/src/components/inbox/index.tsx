"use client";

import { AppConnectionToast } from "@/components/app-connection-toast";
import type { ReactNode } from "react";
import { InboxHeader } from "./inbox-header";
import { UploadZone } from "./inbox-upload-zone";

type Props = {
  children: ReactNode;
};

export function Inbox({ children }: Props) {
  return (
    <UploadZone>
      <AppConnectionToast />
      <InboxHeader />
      {children}
    </UploadZone>
  );
}
