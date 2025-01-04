import { PluggyApi } from "@/providers/pluggy/pluggy-api";
import { getFileExtension } from "@/utils/logo";
import { batchPromises, saveImageFromURL, slugify } from "./utils";

async function main() {
  const provider = new PluggyApi({
    // @ts-ignore
    envs: {
      PLUGGY_CLIENT_ID: process.env.PLUGGY_CLIENT_ID!,
      PLUGGY_SECRET: process.env.PLUGGY_SECRET!,
    },
  });

  const data = await provider.getInstitutions({
    countries: ["BR"],
  });

  const tasks = data.map(async (institution) => {
    const extension = getFileExtension(institution.imageUrl);

    return saveImageFromURL(
      institution.imageUrl,
      `${slugify(institution.name)}.${extension}`,
    );
  });

  await batchPromises(tasks);
}

main();
