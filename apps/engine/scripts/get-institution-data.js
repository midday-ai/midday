import {
  Configuration,
  PlaidApi as PlaidBaseApi,
  PlaidEnvironments,
  Products,
} from "plaid";

function matchLogoURL(id) {
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

export function getPopularity(id) {
  if (PRIORITY_INSTITUTIONS.includes(id)) {
    return 100 - PRIORITY_INSTITUTIONS.indexOf(id);
  }

  return 0;
}

function getLogoURL(id, ext) {
  return `https://cdn-engine.midday.ai/${id}.${ext || "jpg"}`;
}

async function getPlaidInstitutions() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments["production"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });

  const provider = new PlaidBaseApi(configuration);

  const batchSize = 500;
  let offset = 0;
  let allInstitutions = [];

  while (true) {
    const { data } = await provider.institutionsGet({
      country_codes: ["US"],
      count: batchSize,
      offset: offset,
    });

    const institutions = data.institutions.map((institution) => ({
      id: institution.institution_id,
      name: institution.name,
      logo: institution.logo
        ? getLogoURL(institution.institution_id)
        : matchLogoURL(institution.institution_id),
      countries: institution.country_codes,
      popularity: getPopularity(institution.institution_id),
      provider: "plaid",
    }));

    allInstitutions = allInstitutions.concat(institutions);

    if (institutions.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  console.log(`Total institutions fetched: ${allInstitutions.length}`);
  return allInstitutions;
}

export async function getInstitutions() {
  // Implement your logic here
  // Return an array of institution documents
  const data = await Promise.all([getPlaidInstitutions()]);

  return data.flat();
}
