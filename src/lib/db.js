import mysql from "mysql2/promise";

const globalForDb = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return mysql.createPool(connectionString);
}

export const db = globalForDb.dbPool || createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = db;
}
