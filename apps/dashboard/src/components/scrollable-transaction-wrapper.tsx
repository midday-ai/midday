import { getTeamBankAccounts } from "@midday/supabase/cached-queries";
import React from 'react';
import ScrollableTransactionsClientWrapper from './scrollable-transactions-client-wrapper';


const ScrollableTransactionsWrapper: React.FC = async () => {
    const accounts = await getTeamBankAccounts();

    // convert to custom account type
    const customAccounts = accounts?.data?.map((account) => ({
        id: account.account_id,
        name: account.name || "",
    }));

    return <ScrollableTransactionsClientWrapper accounts={customAccounts || []} />;
};