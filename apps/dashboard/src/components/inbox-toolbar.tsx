"use client";

import { SelectTransaction } from "./select-transaction";

export function InboxToolbar({ selectedItem, teamId, onSelect }) {
  return (
    <div className="h-12 dark:bg-[#1A1A1A] bg-[#F6F6F3] justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg fixed bottom-14 right-[160px] z-50 w-[400px]">
      <SelectTransaction
        key={selectedItem.id}
        placeholder="Select transaction"
        teamId={teamId}
        inboxId={selectedItem.id}
        selectedTransaction={selectedItem?.transaction}
        onSelect={onSelect}
      />
    </div>
  );
}
