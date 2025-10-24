// joinMapper.js

/**
 * Iteratively finds the required fields by traversing all related tables
 * until found or all options are exhausted.
 *
 * @param {Object} parsedResource - Resource definition (contains base + relations)
 * @param {Array} requestedFields - List of requested field names
 * @returns {String} SQL JOIN clause string
 */
export function mapJoins(parsedResource, requestedFields = []) {
  // parsedResource is expected to contain a baseTable object and a relations map
  const { baseTable, relations } = parsedResource || {};
  if (!relations || Object.keys(relations).length === 0) return "";

  // If no specific fields are requested → join all relations (legacy fallback)
  if (!requestedFields || requestedFields.length === 0) {
    return Object.values(relations)
      .map((rel) => `LEFT JOIN ${rel.table} ${rel.alias} ON ${rel.on}`)
      .join(" ");
  }

  const joinClauses = [];
  const resolvedFields = new Set();

  // Helper to check if a table definition contains the field
  const tableHasField = (tableDef, field) =>
    tableDef &&
    Array.isArray(tableDef.fields) &&
    tableDef.fields.includes(field);

  // For each requested field, find which table/relation provides it and add joins
  for (const field of requestedFields) {
    // Skip if already resolved
    if (resolvedFields.has(field)) continue;

    // Check base table first
    if (tableHasField(baseTable, field)) {
      resolvedFields.add(field);
      continue;
    }

    // Otherwise, search relations for the field
    let found = false;
    for (const rel of Object.values(relations)) {
      if (tableHasField(rel, field)) {
        // Add join clause if not already present
        const alreadyJoined = joinClauses.some(
          (j) => j.includes(` ${rel.alias} `) || j.includes(`${rel.alias}.`)
        );
        if (!alreadyJoined) {
          joinClauses.push(`LEFT JOIN ${rel.table} ${rel.alias} ON ${rel.on}`);
        }
        resolvedFields.add(field);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Field "${field}" not found in any table or relation.`);
    }
  }

  return joinClauses.join(" ");
}
