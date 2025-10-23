// db.js
// This file is responsible for connecting our backend to MySQL

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config(); // loads variables from .env file

// Create a connection pool (better than single connection for performance)
export const pool = mysql.createPool({
  host: process.env.DB_HOST, // where MySQL is running (localhost)
  user: process.env.DB_USER, // MySQL username
  password: process.env.DB_PASSWORD, // MySQL password
  database: process.env.DB_NAME, // which DB to use
  waitForConnections: true,
  connectionLimit: 10, // up to 10 simultaneous connections
  queueLimit: 0,
});
