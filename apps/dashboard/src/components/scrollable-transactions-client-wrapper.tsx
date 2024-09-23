'use client';

import React, { useState } from 'react';
import ScrollableTransactionSelector from './scrollable-transaction-selector';
import ScrollableTransactionsCard from './scrollable-transactions';

interface Account {
    id: string;
    name: string;
}

interface ScrollableTransactionsClientWrapperProps {
    accounts: Account[];
}

const ScrollableTransactionsClientWrapper: React.FC<ScrollableTransactionsClientWrapperProps> = ({ accounts }) => {
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(accounts[0]?.id || "");

    return (
        <div>
            <ScrollableTransactionSelector
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onAccountChange={setSelectedAccountId}
            />
            <ScrollableTransactionsCard selectedAccountId={selectedAccountId} />
        </div>
    );
};

export default ScrollableTransactionsClientWrapper;