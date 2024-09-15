import conf from "../conf.json";
import fs from "fs";

const pluginsEnabled = conf.plugins_enabled;

let importStrings: any = [];
let funcStrings: any = {};
let funcs: any = {};

for (const plugin of pluginsEnabled) {
  const manifest = await import(`./${plugin}/manifest.json`);
  const functions = manifest.functions.map((func: any) => func.id);
  importStrings = [
    ...importStrings,
    ...functions.map(
      (func: any) =>
        `import { handler as ${manifest.id}${func} } from "./${plugin}/${func}"`,
    ),
  ];

  funcs[plugin] = {};
  functions.forEach((func: any) => {
    funcs[plugin][func] = func;
  });

  funcStrings[plugin] = [];
  for (let key in funcs[plugin]) {
    funcStrings[plugin].push(`"${key}": ${manifest.id}${funcs[plugin][key]}`);
  }
}

const indexFilePath = "./plugins/index.ts";

let finalFuncStrings: any = [];
for (let key in funcStrings) {
  finalFuncStrings.push(
    `\n  "${key}": {\n    ${funcStrings[key].join(",\n    ")}\n  }`,
  );
}

const content = `${importStrings.join("\n")}\n\nexport const plugins = {${finalFuncStrings}\n};\n`;

fs.writeFileSync(indexFilePath, content);
