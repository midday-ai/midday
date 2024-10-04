import fs from "node:fs";
import path from "node:path";
import { getLogoURL } from "@/utils/logo";

const PRIORITY_INSTITUTIONS = [
  // US
  "chase", // Chase
  "wells_fargo", // Wells Fargo
  "bank_of_america", // Bank Of America
  "pnc", // PNC
  "credit_one", // CreditOne
  "capital_one", // CapitalOne
  "us_bank", // US Bank
  "usaa", // USAA
  "mercury", // Mercury
  "citibank", // Citibank
  "silicon_valley_bank", // Silicon Valley Bank
  "first_republic", // First Republic
  "brex", // Brex
  "amex", // American Express
  "ins_133680", // Angel List
  "morgan_stanley", // Morgan Stanley
  "truist", // Truist
  "td_bank", // TD Bank
  "ins_29", // KeyBank
  "ins_19", // Regions Bank
  "fifth_third", // Fifth Third Bank
  "ins_111098", // Citizens Bank
  "ins_100103", // Comerica Bank
  "ins_21", // Huntington Bank
];

export function getPopularity(id: string) {
  if (PRIORITY_INSTITUTIONS.includes(id)) {
    return 100 - PRIORITY_INSTITUTIONS.indexOf(id);
  }

  return 0;
}

export function matchLogoURL(id: string) {
  switch (id) {
    case "ins_56":
      return getLogoURL("chase");
    case "ins_127991":
      return getLogoURL("wells_fargo");
    case "ins_116236":
      return getLogoURL("ins_116236");
    case "ins_133019":
      return getLogoURL("wise");
    case "ins_126265":
    case "ins_126523":
    case "ins_115575":
    case "ins_117163":
      return getLogoURL("vancity");
    case "ins_133354":
      return getLogoURL("ins_133354");
    case "ins_118853":
      return getLogoURL("walmart");
    case "ins_126283":
      return getLogoURL("rocky");
    case "ins_115771":
      return getLogoURL("revelstoke");
    case "ins_133347":
      return getLogoURL("ins_133347");
    case "ins_117642":
      return getLogoURL("ins_117642");
    case "ins_116219":
      return getLogoURL("ins_116219");
    case "ins_119478":
      return getLogoURL("ins_119478");
    case "ins_117634":
      return getLogoURL("ins_117634");
    case "ins_117635":
      return getLogoURL("ins_117635");
    case "ins_117600":
      return getLogoURL("ins_117600");
    case "ins_118849":
    case "ins_129638":
      return getLogoURL("ins_118849");
    case "ins_116229":
      return getLogoURL("ins_116229");
    case "ins_117643":
      return getLogoURL("ins_117643");
    case "ins_118897":
      return getLogoURL("ins_118897");
    case "ins_119483":
      return getLogoURL("ins_119483");
    case "ins_119481":
      return getLogoURL("ins_119481");
    case "ins_117542":
      return getLogoURL("ins_117542");
    case "ins_116216":
      return getLogoURL("ins_116216");
    case "ins_118903":
      return getLogoURL("ins_118903");
    default:
      return null;
  }
}

export function saveImageFromString(base64String: string, filePath: string) {
  const buffer = Buffer.from(base64String, "base64");

  try {
    fs.writeFileSync(filePath, buffer);
    console.log(`Image saved successfully to ${filePath}`);
  } catch (err) {
    console.error(`Error saving image: ${err}`);
  }
}

export async function saveImageFromURL(
  url: string,
  fileName: string,
): Promise<void> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    const fullPath = path.resolve(path.join("tasks", "logos", fileName));

    // @ts-ignore
    fs.writeFile(fullPath, buffer, (err) => {
      if (err) {
        throw new Error(`Failed to save image: ${err.message}`);
      }
      console.log(`Image saved to ${fullPath}`);
    });
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

export function saveFile(filePath: string, content: string) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`File saved successfully to ${filePath}`);
  } catch (err) {
    console.error(`Error saving file: ${err}`);
  }
}

const TELLER_ENDPOINT = "https://api.teller.io/institutions";

type TellerResponse = {
  id: string;
  name: string;
  capabilities: string[];
};

export async function getTellerData() {
  const response = await fetch(TELLER_ENDPOINT);

  const data = (await response.json()) as TellerResponse[];

  return data;
}

export async function batchPromises<T>(promises: Promise<T>[]): Promise<T[]> {
  const batchSize = 10;
  const results: T[] = [];

  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}
