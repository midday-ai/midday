// import {
//   DbUtil,
//   type ICryptoService,
//   type IETL,
//   TellerUtil,
// } from "@maybe-finance/server/shared";
// import {
//   AccountUtil,
//   type SharedType,
//   SharedUtil,
// } from "@maybe-finance/shared";
import type { TellerApi, TellerTypes } from "./api";

export type TellerRawData = {
  //   accounts: TellerTypes.Account[];
  //   transactions: TellerTypes.Transaction[];
  //   transactionsDateRange: SharedType.DateRange<DateTime>;
};

export type TellerData = {
  //   accounts: TellerTypes.AccountWithBalances[];
  //   transactions: TellerTypes.Transaction[];
  //   transactionsDateRange: SharedType.DateRange<DateTime>;
};

type Connection = Pick<
  AccountConnection,
  "id" | "userId" | "tellerInstitutionId" | "tellerAccessToken"
>;

export class TellerETL implements IETL<Connection, TellerRawData, TellerData> {
  public constructor(
    private readonly logger: Logger,
    private readonly prisma: PrismaClient,
    private readonly teller: Pick<
      TellerApi,
      "getAccounts" | "getTransactions" | "getAccountBalances"
    >,
    private readonly crypto: ICryptoService
  ) {}

  async extract(connection: Connection): Promise<TellerRawData> {
    if (!connection.tellerInstitutionId) {
      throw new Error(
        `connection ${connection.id} is missing tellerInstitutionId`
      );
    }
    if (!connection.tellerAccessToken) {
      throw new Error(
        `connection ${connection.id} is missing tellerAccessToken`
      );
    }

    const accessToken = this.crypto.decrypt(connection.tellerAccessToken);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: connection.userId },
      select: {
        id: true,
        tellerUserId: true,
      },
    });

    if (!user.tellerUserId) {
      throw new Error(`user ${user.id} is missing tellerUserId`);
    }

    // TODO: Check if Teller supports date ranges for transactions
    const transactionsDateRange = {
      start: DateTime.now().minus(TellerUtil.TELLER_WINDOW_MAX),
      end: DateTime.now(),
    };

    const accounts = await this._extractAccounts(accessToken);

    const transactions = await this._extractTransactions(accessToken, accounts);

    this.logger.info(
      `Extracted Teller data for customer ${user.tellerUserId} accounts=${accounts.length} transactions=${transactions.length}`,
      { connection: connection.id, transactionsDateRange }
    );

    return {
      accounts,
      transactions,
      transactionsDateRange,
    };
  }

  async transform(
    _connection: Connection,
    data: TellerData
  ): Promise<TellerData> {
    return {
      ...data,
    };
  }

  async load(connection: Connection, data: TellerData): Promise<void> {
    // await this.prisma.$transaction([
    //   ...this._loadAccounts(connection, data),
    //   ...this._loadTransactions(connection, data),
    // ]);
    // this.logger.info(`Loaded Teller data for connection ${connection.id}`, {
    //   connection: connection.id,
    // });
  }

  private async _extractAccounts(accessToken: string) {
    // const accounts = await this.teller.getAccounts({ accessToken });
    // return accounts;
  }

  private _loadAccounts(
    connection: Connection,
    { accounts }: Pick<TellerData, "accounts">
  ) {
    // return [
    // upsert accounts
    //   ...accounts.map((tellerAccount) => {
    //     const type = TellerUtil.getType(tellerAccount.type);
    //     const classification = AccountUtil.getClassification(type);
    // return this.prisma.account.upsert({
    //   where: {
    //     accountConnectionId_tellerAccountId: {
    //       accountConnectionId: connection.id,
    //       tellerAccountId: tellerAccount.id,
    //     },
    //   },
    //   create: {
    //     type: TellerUtil.getType(tellerAccount.type),
    //     provider: "teller",
    //     categoryProvider: TellerUtil.tellerTypesToCategory(
    //       tellerAccount.type
    //     ),
    //     subcategoryProvider: tellerAccount.subtype ?? "other",
    //     accountConnectionId: connection.id,
    //     userId: connection.userId,
    //     tellerAccountId: tellerAccount.id,
    //     name: tellerAccount.name,
    //     tellerType: tellerAccount.type,
    //     tellerSubtype: tellerAccount.subtype,
    //     mask: tellerAccount.last_four,
    //     ...TellerUtil.getAccountBalanceData(tellerAccount, classification),
    //   },
    //   update: {
    //     type: TellerUtil.getType(tellerAccount.type),
    //     categoryProvider: TellerUtil.tellerTypesToCategory(
    //       tellerAccount.type
    //     ),
    //     subcategoryProvider: tellerAccount.subtype ?? "other",
    //     tellerType: tellerAccount.type,
    //     tellerSubtype: tellerAccount.subtype,
    //     ..._.omit(
    //       TellerUtil.getAccountBalanceData(tellerAccount, classification),
    //       ["currentBalanceStrategy", "availableBalanceStrategy"]
    //     ),
    //   },
    // });
    //   }),
    // any accounts that are no longer in Teller should be marked inactive
    //   this.prisma.account.updateMany({
    //     where: {
    //       accountConnectionId: connection.id,
    //       AND: [
    //         { tellerAccountId: { not: null } },
    //         { tellerAccountId: { notIn: accounts.map((a) => a.id) } },
    //       ],
    //     },
    //     data: {
    //       isActive: false,
    //     },
    //   }),
    // ];
  }

  private async _extractTransactions(
    accessToken: string,
    tellerAccounts: TellerTypes.GetAccountsResponse
  ) {
    // const accountTransactions = await Promise.all(
    //   tellerAccounts.map(async (tellerAccount) => {
    //     const type = TellerUtil.getType(tellerAccount.type);
    //     const classification = AccountUtil.getClassification(type);
    //     const transactions = await SharedUtil.withRetry(
    //       () =>
    //         this.teller.getTransactions({
    //           accountId: tellerAccount.id,
    //           accessToken,
    //         }),
    //       {
    //         maxRetries: 3,
    //       }
    //     );
    //     if (classification === AccountClassification.asset) {
    //       transactions.forEach((t) => {
    //         t.amount = String(Number(t.amount) * -1);
    //       });
    //     }
    //     return transactions;
    //   })
    // );
    // return accountTransactions.flat();
  }

  private _loadTransactions(
    connection: Connection,
    {
      transactions,
      transactionsDateRange,
    }: Pick<TellerData, "transactions" | "transactionsDateRange">
  ) {}
}
