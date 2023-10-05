import {
	Configuration,
	CountryCode,
	PlaidApi,
	PlaidEnvironments,
	Products,
} from "plaid";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const configuration = new Configuration({
	basePath: PlaidEnvironments.development,
	baseOptions: {
		// headers: {
		// 	"PLAID-CLIENT-ID": "650a1a78bd8162001bb39b2c",
		// 	"PLAID-SECRET": "11f75362b311baad41a0fe4ce45e82",
		// 	"Plaid-Version": "2020-09-14",
		// },
	},
});

const client = new PlaidApi(configuration);

export const plaidRouter = createTRPCRouter({
	createLinkToken: protectedProcedure.mutation(async ({ ctx }) => {
		try {
			const request = {
				user: {
					client_user_id: ctx.session.user.sub,
				},
				client_name: "Midday",
				products: [Products.Transactions],
				country_codes: [CountryCode.Se],
				language: "en",
				webhook: "https://app.midday.ai",
				redirect_uri: "https://app.midday.ai",
			};

			const { data } = await client.linkTokenCreate(request);
			console.log(data);
			return data;
		} catch (error) {
			console.log(error);
		}
	}),
});
