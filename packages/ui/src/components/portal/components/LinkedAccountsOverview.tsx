import React from "react";
import { LinkedAccountCard } from "../../cards/linked-account-card/linked-account-card";

interface LinkedAccountsOverviewProps {
  linkedInstitutions: any[];
}

export const LinkedAccountsOverview: React.FC<LinkedAccountsOverviewProps> = ({
  linkedInstitutions,
}) => (
  <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-3 lg:grid-cols-3">
    {linkedInstitutions.map((link, idx) => (
      <LinkedAccountCard link={link} key={idx} />
    ))}
  </div>
);