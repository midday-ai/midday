import { getFileExtension } from "@/utils/logo";
import { batchPromises, saveImageFromURL } from "./utils";

const GO_CARDLESS_CDN = "https://cdn-logos.gocardless.com/ais/";

async function main() {
  const response = await fetch(
    "https://bankaccountdata.gocardless.com/api/v2/institutions/",
  );

  const data = await response.json();

  // @ts-ignore
  const tasks = data?.map(async (institution) => {
    const fileName = `${institution.id}.${getFileExtension(institution.logo)}`;

    return saveImageFromURL(`${GO_CARDLESS_CDN}/${fileName}`, fileName);
  });

  await batchPromises(tasks);
}

main();
