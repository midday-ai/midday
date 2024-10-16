import { InsertRecurringTransactionsParams } from "@midday/supabase/mutations";
import { Database, RecurringTransactionsForInsert } from "@midday/supabase/types";
import { RequestOptions } from "@solomon-ai/financial-engine-sdk/core.mjs";
import type { TransactionsSchema as EngineTransaction, TransactionRecurringParams, TransactionRecurringResponse } from "@solomon-ai/financial-engine-sdk/resources/transactions";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";
import { BankAccountWithConnection } from "../types/bank-account-with-connection";
import { engine } from "../utils/engine";
import { uniqueLog } from "../utils/log";
import { getClassification, Transaction } from "../utils/transform";
import { sendTransactionsNotificationSubTask } from "./send-transaction-sync-notification";
import { updateBankConnectionStatus } from "./update-bank-connection-status";

async function syncRecurringTransactionsSubTask(
    io: IOWithIntegrations<{ supabase: Supabase<Database, "public", any> }>,
    accountsData: Array<BankAccountWithConnection> | null,
    taskKeyPrefix: string
): Promise<{ success: boolean }> {
    const supabase = io.supabase.client;
    let allNewTransactions: Transaction[] = [];

    return io.runTask(
        `${taskKeyPrefix.toLowerCase()}-sync-recurring-transactions-subtask-${Date.now()}`,
        async () => {
            if (!accountsData) {
                await uniqueLog(io, "info", "No accounts to process");
                return { success: true };
            }

            await Promise.all(accountsData.map(processAccount));
            await sendNotificationsIfNeeded();

            return { success: true };
        },
        { name: "Sync Transactions Sub Task" }
    );

    async function processAccount(account: BankAccountWithConnection) {
        await logAccountInfo(account);

        const transactions = await fetchTransactions(account) as unknown as {
            data: {
                inflow: Array<TransactionRecurringResponse.Inflow>,
                outflow: Array<TransactionRecurringResponse.Outflow>,
            }
        };


        const {
            inflow: inflowTransactions,
            outflow: outflowTransactions,
        } = transactions.data;

        await upsertTransactions(account, inflowTransactions, outflowTransactions);
        await updateAccountBalance(account);
    }

    async function logAccountInfo(account: BankAccountWithConnection) {
        await uniqueLog(io, "info", `Processing account: ${account.id}`);
        await uniqueLog(io, "info", `Account type: ${account.type}`);
        const accountType = getClassification(account.type);
        await uniqueLog(io, "info", `Classified account type: ${accountType}`);
    }

    async function fetchTransactions(account: BankAccountWithConnection): Promise<TransactionRecurringResponse> {
        await uniqueLog(io, "info", `Fetching transactions for account ${account.id}`);
        const params: TransactionRecurringParams = {
            accountId: account.account_id,
            accessToken: account.bank_connection?.access_token,
            provider: "plaid",
        };
        const requestOptions: RequestOptions = {
            headers: { 'Content-Type': 'application/json' },
            maxRetries: 3,
            timeout: 5000,
        };
        return await engine.transactions.recurring(params, requestOptions);
    }

    async function upsertTransactions(account: BankAccountWithConnection, 
        inflow: Array<TransactionRecurringResponse.Inflow>,
        outflow: Array<TransactionRecurringResponse.Outflow>) {

        let tinflow, toutflow: RecurringTransactionsForInsert[] = [];
        if (inflow) {
            tinflow = transformTransactions(inflow, account.id);
        }
        if (outflow) {
            toutflow = transformTransactions(outflow, account.id);
        }

        const { error } = await supabase.rpc("insert_recurring_transactions", { p_data: { inflow: tinflow, outflow: toutflow } });
        if (error) {
            throw new Error(`Failed to upsert recurring transactions: ${error.message}`);
        }

        await uniqueLog(io, "info", `Recurring transactions upserted successfully for account ${account.id}`);
    }

    function transformTransactions(transactions: (TransactionRecurringResponse.Inflow | TransactionRecurringResponse.Outflow)[], accountId: string): Array<RecurringTransactionsForInsert> {
        return transactions.map(transaction => ({
            account_id: accountId,
            average_amount: transaction.average_amount.amount,
            category: transaction.personal_finance_category?.primary ? [transaction.personal_finance_category.primary] : null,
            personal_finance_category: {
                primary: transaction.personal_finance_category?.primary || '',
                detailed: transaction.personal_finance_category?.detailed || '',
                confidence_level: transaction.personal_finance_category?.confidence_level || '',
            },
            description: transaction.description,
            first_date: transaction.first_date,
            frequency: transaction.frequency,
            is_active: transaction.is_active,
            is_user_modified: transaction.is_user_modified,
            last_amount: transaction.last_amount.amount,
            last_date: transaction.last_date,
            last_user_modified_datetime: transaction.last_user_modified_datetime,
            merchant_name: transaction.merchant_name,
            status: transaction.status,
            stream_id: transaction.stream_id,
            transaction_ids: transaction.transaction_ids,
        }));
    }

    async function updateAccountBalance(account: BankAccountWithConnection) {
        await uniqueLog(io, "info", `Fetching balance for account ${account.id}`);
        const balance = await engine.accounts.balance({
            provider: account.bank_connection.provider,
            id: account.account_id,
            accessToken: account.bank_connection?.access_token,
        });
        await uniqueLog(io, "info", `Retrieved balance for account ${account.id}: ${balance.data?.amount}`);

        if (balance.data?.amount) {
            await supabase
                .from("bank_accounts")
                .update({ balance: balance.data.amount })
                .eq("id", account.id);
            await uniqueLog(io, "info", `Balance updated for account ${account.id}`);

            await updateBankConnectionStatus(io, account.bank_connection?.id, "connected", taskKeyPrefix, null);
        }
    }

    async function sendNotificationsIfNeeded() {
        if (allNewTransactions.length > 0) {
            await sendTransactionsNotificationSubTask(
                io,
                allNewTransactions as Array<EngineTransaction.Data>,
                accountsData?.[0]?.team_id as string,
                taskKeyPrefix
            );
        }
    }
}

export { syncRecurringTransactionsSubTask };
