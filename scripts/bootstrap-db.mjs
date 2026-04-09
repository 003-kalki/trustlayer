import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rootDir = process.cwd();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (process.env[key]) {
      continue;
    }

    let value = valueParts.join("=").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Add it to .env or your hosting provider env vars.");
  process.exit(1);
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const databaseName = databaseUrl.pathname.replace(/^\//, "");

if (!databaseName) {
  console.error("DATABASE_URL must include a database name, e.g. mysql://user:pass@host:3306/trustlayer");
  process.exit(1);
}

const connectionOptions = {
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  multipleStatements: false,
};

const db = await mysql.createConnection(connectionOptions);
await db.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
await db.changeUser({ database: databaseName });

async function tableColumns(tableName) {
  const [rows] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set(rows.map((row) => row.Field));
}

async function addColumnIfMissing(tableName, columns, columnName, definition) {
  if (columns.has(columnName)) {
    return;
  }

  await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  columns.add(columnName);
}

async function tableIndexes(tableName) {
  const [rows] = await db.query(`SHOW INDEX FROM \`${tableName}\``);
  return new Set(rows.map((row) => row.Key_name));
}

async function addIndexIfMissing(tableName, indexes, indexName, sql) {
  if (indexes.has(indexName)) {
    return;
  }

  await db.query(sql);
  indexes.add(indexName);
}

await db.query(`
  CREATE TABLE IF NOT EXISTS \`user\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`walletAddress\` VARCHAR(191) NOT NULL,
    \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`User_walletAddress_key\` (\`walletAddress\`)
  )
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS \`profile\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`userId\` VARCHAR(191) NOT NULL,
    \`handle\` VARCHAR(191) NULL,
    \`displayName\` VARCHAR(191) NULL,
    \`bio\` TEXT NULL,
    \`role\` VARCHAR(191) NOT NULL DEFAULT 'BOTH',
    \`privacyMode\` VARCHAR(191) NOT NULL DEFAULT 'SELECTIVE',
    \`isFreelancer\` BOOLEAN NOT NULL DEFAULT FALSE,
    \`githubVerified\` BOOLEAN NOT NULL DEFAULT FALSE,
    \`upworkVerified\` BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`Profile_userId_key\` (\`userId\`),
    UNIQUE KEY \`Profile_handle_key\` (\`handle\`),
    CONSTRAINT \`Profile_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE
  )
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS \`contract\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`title\` VARCHAR(191) NOT NULL,
    \`description\` TEXT NOT NULL,
    \`milestoneAmount\` DOUBLE NOT NULL,
    \`totalAmount\` DOUBLE NOT NULL,
    \`deadline\` DATETIME NOT NULL,
    \`status\` VARCHAR(191) NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    \`outcome\` VARCHAR(191) NULL,
    \`fundedAt\` DATETIME NULL,
    \`acceptedAt\` DATETIME NULL,
    \`completedAt\` DATETIME NULL,
    \`disputedAt\` DATETIME NULL,
    \`outcomeReportedBy\` VARCHAR(191) NULL,
    \`outcomeNote\` TEXT NULL,
    \`employerId\` VARCHAR(191) NOT NULL,
    \`freelancerId\` VARCHAR(191) NULL,
    \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`web3JobId\` VARCHAR(191) NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`Contract_web3JobId_key\` (\`web3JobId\`),
    KEY \`Contract_employerId_fkey\` (\`employerId\`),
    KEY \`Contract_freelancerId_fkey\` (\`freelancerId\`),
    CONSTRAINT \`Contract_employerId_fkey\` FOREIGN KEY (\`employerId\`) REFERENCES \`user\`(\`id\`),
    CONSTRAINT \`Contract_freelancerId_fkey\` FOREIGN KEY (\`freelancerId\`) REFERENCES \`user\`(\`id\`)
  )
`);

const profileColumns = await tableColumns("profile");
await addColumnIfMissing("profile", profileColumns, "displayName", "VARCHAR(191) NULL");
await addColumnIfMissing("profile", profileColumns, "role", "VARCHAR(191) NOT NULL DEFAULT 'BOTH'");
await addColumnIfMissing("profile", profileColumns, "privacyMode", "VARCHAR(191) NOT NULL DEFAULT 'SELECTIVE'");

const contractColumns = await tableColumns("contract");
await addColumnIfMissing("contract", contractColumns, "outcome", "VARCHAR(191) NULL");
await addColumnIfMissing("contract", contractColumns, "fundedAt", "DATETIME NULL");
await addColumnIfMissing("contract", contractColumns, "acceptedAt", "DATETIME NULL");
await addColumnIfMissing("contract", contractColumns, "completedAt", "DATETIME NULL");
await addColumnIfMissing("contract", contractColumns, "disputedAt", "DATETIME NULL");
await addColumnIfMissing("contract", contractColumns, "outcomeReportedBy", "VARCHAR(191) NULL");
await addColumnIfMissing("contract", contractColumns, "outcomeNote", "TEXT NULL");
await addColumnIfMissing("contract", contractColumns, "web3JobId", "VARCHAR(191) NULL");

const contractIndexes = await tableIndexes("contract");
await addIndexIfMissing(
  "contract",
  contractIndexes,
  "Contract_web3JobId_key",
  "ALTER TABLE `contract` ADD UNIQUE KEY `Contract_web3JobId_key` (`web3JobId`)"
);

await db.end();
console.log(`Database '${databaseName}' is ready.`);
