export function getLogoURL(id: string, ext?: string) {
  return `https://cdn-engine.midday.ai/${id}.${ext || "jpg"}`;
}

export function getFileExtension(url: string) {
  return url.split(".").pop();
}

const PRIORITY_INSTITUTIONS = [
  // US
  "ins_56", // Chase
  "ins_127991", // Wells Fargo
  "ins_127989", // Bank Of America
  "pnc", // PNC
  "credit_one", // CreditOne
  "capital_one", // CapitalOne
  "us_bank", // US Bank
  "ins_7", // USAA
  "mercury", // Mercury
  "citibank", // Citibank
  "silicon_valley_bank", // Silicon Valley Bank
  "first_republic", // First Republic
  "ins_127888", // Brex
  "amex", // American Express
  "ins_133680", // Angel List
  "morgan_stanley", // Morgan Stanley
  "ins_130888", // Truist
  "ins_14", // TD Bank
  "ins_29", // KeyBank
  "ins_19", // Regions Bank
  "ins_26", // Fifth Third Bank
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
    default:
      return null;
  }
}
