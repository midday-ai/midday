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

/**
 * The main function that orchestrates the process of importing institutions into Typesense.
 *
 * This function performs the following steps:
 * 1. Retrieves institution data using the getInstitutions function.
 * 2. Checks if the 'institutions' collection already exists in Typesense.
 * 3. Deletes the existing collection if it exists.
 * 4. Creates a new 'institutions' collection with the defined schema.
 * 5. Imports the institution documents into the newly created collection.
 * 6. Logs the results of the import process.
 *
 * @async
 * @function main
 * @throws {Error} If there's an issue with retrieving institutions, managing the Typesense collection, or importing documents.
 * @returns {Promise<void>}
 */
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

/**
 * Initializes and executes the main function, handling any unhandled errors.
 *
 * This immediately invoked async function serves as the entry point for the script.
 * It calls the main function and catches any unhandled errors that might occur during execution.
 * If an unhandled error occurs, it logs the error and exits the process with a non-zero status code.
 *
 * @async
 * @function
 * @throws {Error} Logs any unhandled error and exits the process.
 * @returns {Promise<void>}
 */
(async () => {
  try {
    await main();
  } catch (error) {
    console.error("Unhandled error:", error);
    process.exit(1);
  }
})();
