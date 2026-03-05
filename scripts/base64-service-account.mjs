import fs from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/base64-service-account.mjs path/to/service-account.json");
  process.exit(1);
}

const json = fs.readFileSync(path, "utf8");
const b64 = Buffer.from(json, "utf8").toString("base64");
console.log(b64);
