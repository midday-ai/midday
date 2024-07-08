import { GoCardLessApi } from "@/providers/gocardless/gocardless-api";
import { PlaidApi } from "@/providers/plaid/plaid-api";
import { TellerApi } from "@/providers/teller/teller-api";

export async function getInstitutions(countryCode: string) {
  const gocardless = new GoCardLessApi();
  const teller = new TellerApi();
  const plaid = new PlaidApi();

  return Promise.allSettled([
    gocardless.getInstitutions({ countryCode }),
    teller.getInstitutions({ countryCode }),
    plaid.getInstitutions({ countryCode }),
  ]);
}
