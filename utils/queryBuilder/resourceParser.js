import fs from "fs";
import path from "path";

// Load your resource definition JSON (we'll store it in utils)
const resourceDefPath = path.resolve("./utils/resourceDef.json");

/**
 * Parses the given resource name and returns
 * its table, alias, fields, and relationships.
 */
export function parseResource(resourceName) {
  const jsonData = fs.readFileSync(resourceDefPath, "utf-8");
  const resourceDefs = JSON.parse(jsonData);

  const def = resourceDefs[resourceName];
  if (!def)
    throw new Error(`Resource definition not found for: ${resourceName}`);

  return def;
}
