import { mapJoins } from "./joinMapper.js";

export function buildSelectQuery(parsedResource) {
  const { table, alias, fields } = parsedResource;

  // Build SELECT clause
  const selectClause =
    "SELECT " +
    Object.entries(fields)
      .map(([key, val]) => `${val} AS ${key}`)
      .join(", ");

  // FROM clause
  const fromClause = `FROM ${table} ${alias}`;

  // JOIN clause
  const joinClause = mapJoins(parsedResource);

  return `${selectClause} ${fromClause} ${joinClause}`;
}
