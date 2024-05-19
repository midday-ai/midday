export type ExtractedTransaction = {
  date: string;
  description: string;
  amount: number;
};

export type CsvTransformedParams = {
  raw: string;
  extracted: ExtractedTransaction[];
  teamId: string;
};

export type FindIndexesByKeyParams = {
  raw: string[];
  input: ExtractedTransaction[];
  key: "date" | "amount" | "description";
  parse?: (value: string | number) => string | number;
};
