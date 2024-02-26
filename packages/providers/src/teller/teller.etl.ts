import { type IETL } from "../shared/etl";
import type { TellerApi, TellerTypes } from "./api";

export type TellerRawData = {
  accounts: TellerTypes.Account[];
  transactions: TellerTypes.Transaction[];
};

export type TellerData = {
  accounts: TellerTypes.Account[];
  transactions: TellerTypes.Transaction[];
};

type Connection = any;

export class TellerETL implements IETL<Connection, TellerRawData, TellerData> {
  public constructor(
    // private readonly prisma: PrismaClient,
    private readonly teller: Pick<TellerApi, "getAccounts" | "getTransactions">
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

    // const accessToken = this.crypto.decrypt(connection.tellerAccessToken);

    const accessToken = "";

    const accounts = await this._extractAccounts(accessToken);
    const transactions = await this._extractTransactions(accessToken, accounts);

    return {
      accounts,
      transactions,
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
    return this.teller.getAccounts({ accessToken });
  }

  private _loadAccounts(
    connection: Connection,
    { accounts }: Pick<TellerData, "accounts">
  ) {
    return [];
  }

  private async _extractTransactions(
    accessToken: string,
    tellerAccounts: TellerTypes.GetAccountsResponse
  ) {
    return [];
  }

  private _loadTransactions(
    connection: Connection,
    { transactions }: Pick<TellerData, "transactions">
  ) {
    return [];
  }
}
