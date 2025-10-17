export function buildWhere(filters) {
  if (!filters || Object.keys(filters).length === 0) return "";

  const conditions = [];

  for (const [key, value] of Object.entries(filters)) {
    const [field, operator] = key.split(".");

    switch (operator) {
      case "eq":
        conditions.push(`${field} = '${value}'`);
        break;
      case "between":
        conditions.push(`${field} BETWEEN ${value[0]} AND ${value[1]}`);
        break;
      case "in":
        conditions.push(
          `${field} IN (${value.map((v) => `'${v}'`).join(", ")})`
        );
        break;
      case "lt":
        conditions.push(`${field} < ${value}`);
        break;
      case "gt":
        conditions.push(`${field} > ${value}`);
        break;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  return conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
}
