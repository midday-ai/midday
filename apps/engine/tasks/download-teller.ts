import { batchPromises, getTellerData, saveImageFromURL } from "./utils";

const TELLER_CDN = "https://teller.io/images/banks";

async function main() {
  const data = await getTellerData();

  const tasks = data.map(async (institution) => {
    const fileName = `${institution.id}.jpg`;

    return saveImageFromURL(`${TELLER_CDN}/${fileName}`, fileName);
  });

  await batchPromises(tasks);
}

main();
