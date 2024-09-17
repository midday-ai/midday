import dotenv from "dotenv";
import Typesense from "typesense";

import { getInstitutions } from "./get-institution-data.js";

dotenv.config();

const typesense = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST,
      port: 443,
      protocol: "https",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY,
  numRetries: 3,
  connectionTimeoutSeconds: 120,
  logLevel: "debug",
});

const schema = {
  name: "institutions",
  num_documents: 0,
  fields: [
    {
      name: "name",
      type: "string",
      facet: false,
    },
    {
      name: "countries",
      type: "string[]",
      facet: true,
    },
    {
      name: "provider",
      type: "string",
      facet: true,
    },
    {
      name: "popularity",
      type: "int32",
      facet: false,
    },
  ],
  default_sorting_field: "popularity",
};

async function main() {
  try {
    const documents = await getInstitutions();
    console.log(`Importing ${documents.length} institutions...`);

    // Check if the collection exists
    let collectionExists = false;
    try {
      await typesense.collections("institutions").retrieve();
      collectionExists = true;
    } catch (error) {
      if (error.httpStatus !== 404) {
        throw error;
      }
    }

    // Delete the collection if it exists, otherwise create it
    if (collectionExists) {
      await typesense.collections("institutions").delete();
    }
    await typesense.collections().create(schema);

    const result = await typesense
      .collections("institutions")
      .documents()
      .import(documents, { action: "upsert" });

    console.log("Import completed successfully.");
    console.log(`Imported ${result.length} documents.`);
  } catch (error) {
    console.error("Error during import:", error);
    if (error.importResults) {
      console.log("Import results:", error.importResults);
    }
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
