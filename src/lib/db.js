import mysql from "mysql2/promise";

const globalForDb = globalThis;

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  return mysql.createPool(connectionString);
}

function getPool() {
  if (!globalForDb.dbPool) {
    globalForDb.dbPool = createPool();
  }
  return globalForDb.dbPool;
}

// The pool is created on first query, not at import, so builds and pages that never touch
// the database still work when DATABASE_URL is missing (e.g. a frontend-only deployment).
export const db = {
  query: (...args) => getPool().query(...args),
};

export function getDatabaseErrorMessage(error) {
  if (!error) {
    return "Database connection failed.";
  }

  if (error.code === "ER_ACCESS_DENIED_ERROR") {
    return "Database credentials were rejected. Update DATABASE_URL with a valid MySQL user and password before using hosted profile and contract sync features.";
  }

  if (error.code === "ECONNREFUSED") {
    return "Database server is unavailable. Start MySQL or point DATABASE_URL at a reachable database.";
  }

  if (error.message?.includes("DATABASE_URL is not configured")) {
    return "DATABASE_URL is not configured. Add your MySQL connection string before starting the app.";
  }

  if (error.code === "ER_DUP_ENTRY") {
    return "A database record with that unique value already exists.";
  }

  if (error.code === "ER_BAD_FIELD_ERROR") {
    return "Database schema is out of date. Run npm run db:bootstrap, then retry.";
  }

  return "Database request failed.";
}
