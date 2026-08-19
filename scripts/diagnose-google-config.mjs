import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env");
const envLine = fs.readFileSync(envPath, "utf8").split("\n").find((line) => line.startsWith("GOOGLE_MAPS_API_KEY="));
console.log(JSON.stringify({
  cwd: process.cwd(),
  envFileHasKeyLine: Boolean(envLine),
  envFileKeyLength: envLine ? envLine.slice("GOOGLE_MAPS_API_KEY=".length).trim().length : 0,
  processEnvHasKeyBeforeLoader: Boolean(process.env.GOOGLE_MAPS_API_KEY),
}));
await import("./load-env.js");
console.log(JSON.stringify({
  processEnvHasKeyAfterLoader: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  processEnvKeyLengthAfterLoader: process.env.GOOGLE_MAPS_API_KEY?.length ?? 0,
}));
