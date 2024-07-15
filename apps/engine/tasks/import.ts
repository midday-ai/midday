import Typesense from "typesense";
import { getInstitutions } from "./get-institutions";

const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_ENDPOINT!,
      port: 443,
      protocol: "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY!,
  numRetries: 3,
  connectionTimeoutSeconds: 120,
  logLevel: "debug",
});

// const schema = {
//   name: "institutions",
//   num_documents: 0,
//   fields: [
//     {
//       name: "name",
//       type: "string",
//       facet: false,
//     },
//     {
//       name: "countries",
//       type: "string[]",
//       facet: true,
//     },
//     {
//       name: "provider",
//       type: "string",
//       facet: true,
//     },
//     {
//       name: "popularity",
//       type: "int32",
//       facet: false,
//     },
//   ],
//   default_sorting_field: "popularity",
// };

async function main() {
  const documents = await getInstitutions();

  // await typesense.collections("institutions").delete();

  try {
    // await typesense.collections().create(schema);
    await typesense
      .collections("institutions")
      .documents()
      .import(documents, { action: "upsert" });
  } catch (error) {
    // @ts-ignore
    console.log(error.importResults);
  }
}

main();
