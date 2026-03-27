import chalk from "chalk";
import Table from "cli-table3";

interface TableOptions {
  head: string[];
  rows: (string | number | null | undefined)[][];
  title?: string;
  pageInfo?: string;
}

export function printTable({
  head,
  rows,
  title,
  pageInfo,
}: TableOptions): void {
  if (title) {
    console.log();
    console.log(`  ${chalk.bold(title)}`);
  }

  const table = new Table({
    head: head.map((h) => chalk.dim(h)),
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "  ",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: "  ",
    },
    style: {
      head: [],
      border: [],
      "padding-left": 0,
      "padding-right": 1,
    },
  });

  for (const row of rows) {
    table.push(
      row.map((cell) => (cell == null ? chalk.dim("—") : String(cell))),
    );
  }

  console.log(table.toString());

  if (pageInfo) {
    console.log();
    console.log(`  ${chalk.dim(pageInfo)}`);
  }

  console.log();
}

export function printDetail(
  title: string,
  fields: [string, string | number | null | undefined][],
): void {
  console.log();
  console.log(`  ${chalk.bold(title)}`);
  console.log();

  const maxLabel = Math.max(...fields.map(([label]) => label.length));

  for (const [label, value] of fields) {
    const paddedLabel = label.padEnd(maxLabel);
    const display = value == null ? chalk.dim("—") : String(value);
    console.log(`  ${chalk.dim(paddedLabel)}  ${display}`);
  }

  console.log();
}
