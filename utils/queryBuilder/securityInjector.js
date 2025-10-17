export function injectSecurity(whereClause, jwt) {
  let securityConditions = [];

  if (jwt.company_id !== undefined) {
    securityConditions.push(`company_id = ${jwt.company_id}`);
  }

  if (jwt.team_ids && jwt.team_ids.length > 0) {
    securityConditions.push(`team_id IN (${jwt.team_ids.join(",")})`);
  }

  if (securityConditions.length === 0) return whereClause;

  // Merge with existing WHERE clause
  if (whereClause.trim() === "") {
    return "WHERE " + securityConditions.join(" AND ");
  } else {
    return whereClause + " AND " + securityConditions.join(" AND ");
  }
}
