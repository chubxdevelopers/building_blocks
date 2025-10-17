// Handles LIMIT/OFFSET for pagination
export function addPagination(pagination) {
  if (!pagination) return "";
  const { limit, offset } = pagination;
  let clause = "";
  if (limit !== undefined) clause += ` LIMIT ${limit}`;
  if (offset !== undefined) clause += ` OFFSET ${offset}`;
  return clause;
}

// Handles ORDER BY
export function buildOrderBy(orderBy) {
  if (!orderBy) return "";
  const parts = Object.entries(orderBy).map(
    ([field, direction]) => `${field} ${direction.toUpperCase()}`
  );
  return parts.length ? ` ORDER BY ${parts.join(", ")}` : "";
}
