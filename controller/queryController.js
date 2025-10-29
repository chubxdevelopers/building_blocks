import { execQuery, execInsert } from "../utils/queryBuilder/queryExecutor.js";

export async function handleVersionedQuery(req, res) {
  const { version, resource } = req.params;
  const method = req.method;
  const { filters, orderBy, pagination } = req.query;

  // Validate API version
  if (version !== "v1") {
    return res.status(400).json({ message: "Invalid API version" });
  }

  // GET request handler for fetching data
  if (method === "GET") {
    try {
      // Build and execute the SQL query using the centralized executor
      const rows = await execQuery({
        resource,
        filters: filters ? JSON.parse(filters) : null,
        orderBy: orderBy ? JSON.parse(orderBy) : null,
        pagination: pagination ? JSON.parse(pagination) : null,
        jwt: req.jwt,
      });

      // Format response with pagination metadata
      return res.json({
        data: rows,
        meta: {
          nextCursor: pagination?.cursor || null,
          total: rows.length,
        },
      });
    } catch (error) {
      console.error("Query execution failed:", error);
      return res.status(500).json({
        message: "Database query failed",
        error: error.message,
      });
    }
  }

  // POST request handler for inserting data
  if (method === "POST") {
    const body = req.body;
    try {
      // Optional: attempt to build/select from the resource to validate it
      // (execQuery will throw if resource definition is invalid)
      await execQuery({ resource, filters: null, orderBy: null, pagination: null, jwt: req.jwt });

      // Execute insert via executor (parameterized)
      const result = await execInsert(resource, body);

      return res.status(201).json({
        data: {
          created: true,
          id: result.insertId,
          payload: body,
        },
      });
    } catch (error) {
      console.error("Insert operation failed:", error);
      return res.status(500).json({
        message: "Database insert failed",
        error: error.message,
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
