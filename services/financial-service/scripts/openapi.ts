import { newApp } from "@/hono/app";
import fs from "fs";

const schema = newApp().getOpenAPIDocument({
    openapi: "3.0.0",
    info: {
        title: "Financial Service API",
        version: "1.0.0",
    },
});

// Write the final schema
fs.writeFileSync("./spec/openapi.json", JSON.stringify(schema, null, 2));