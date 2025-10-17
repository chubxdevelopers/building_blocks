export function mapJoins(parsedResource) {
  const { relations } = parsedResource;
  if (!relations) return "";

  const joinClauses = Object.values(relations).map((rel) => {
    return `LEFT JOIN ${rel.table} ${rel.alias} ON ${rel.on}`;
  });

  return joinClauses.join(" ");
}
