export type GetTransactionsParams = {
  accountId: string;
  latest?: boolean;
};

export type GetStatusResponse = {
  page: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status: {
    indicator: string;
    description: string;
  };
};
