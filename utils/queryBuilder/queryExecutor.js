import { pool } from "../../db.js";
import { buildQuery } from "./queryBuilder.js";
import { parseResource } from "./resourceParser.js";

/**
 * Execute a SELECT-style query using the query builder.
 * Accepts the same config object as buildQuery and returns rows.
 */
export async function execQuery(config) {
  const sql = buildQuery(config);
  const [rows] = await pool.promise().query(sql);
  return rows;
}

/**
 * Execute a simple INSERT for a resource using parameterized query.
 * This is intentionally simple: INSERT INTO <resource> SET ?
 */
export async function execInsert(resource, payload) {
  // Validate resource name against resource definitions to avoid SQL injection
  try {
    parseResource(resource);
  } catch (err) {
    throw new Error(`Invalid resource for insert: ${resource}`);
  }

  const [result] = await pool.promise().query(`INSERT INTO ${resource} SET ?`, [payload]);
  return result;
}

/**
 * Execute a simple UPDATE for a resource. `filters` follows the same format used
 * by buildWhere / buildQuery (an object mapping field or field.operator to value).
 * The WHERE clause will be built using the existing builder and values will be
 * escaped by the where builder.
 */
export async function execUpdate(resource, payload, filters) {
  try {
    parseResource(resource);
  } catch (err) {
    throw new Error(`Invalid resource for update: ${resource}`);
  }

  // Build WHERE clause using the where builder to ensure consistent escaping
  // Import here to avoid circular imports at module top in some setups.
  const { buildWhere } = await import("./whereBuilder.js");
  const whereSQL = buildWhere(filters || {});

  const sql = `UPDATE ${resource} SET ? ${whereSQL}`;
  const [result] = await pool.promise().query(sql, [payload]);
  return result;
}

export default { execQuery, execInsert };
