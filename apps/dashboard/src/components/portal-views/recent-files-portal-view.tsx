import { formatDate } from "@midday/ui/lib/converters/date-formater";
import React from "react";
import { Spending } from "../charts/spending";
import { Vault } from "../widgets/vault";
import { PortalViewWrapper } from "./portal-view-wrapper";

interface RecentFilesPortalViewProps {
  disabled: boolean;
}

export const RecentFilesPortalView: React.FC<RecentFilesPortalViewProps> = ({
  disabled,
}) => {
  return (
    <PortalViewWrapper
      title="Recent Workspace Access"
      description="See your recent files add and updated in your workspace."
      subtitle={`Recent Files Accessed Across Your Workspace`}
      disabled={disabled}
    >
      <Vault key="vault" />
    </PortalViewWrapper>
  );
};
