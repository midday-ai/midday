type BlocklistEntry = {
  type: "email" | "domain";
  value: string;
};

export function separateBlocklistEntries(entries: BlocklistEntry[]) {
  const blockedDomains = entries
    .filter((entry) => entry.type === "domain")
    .map((entry) => entry.value.toLowerCase());
  const blockedEmails = entries
    .filter((entry) => entry.type === "email")
    .map((entry) => entry.value.toLowerCase());

  return {
    blockedDomains,
    blockedEmails,
  };
}
