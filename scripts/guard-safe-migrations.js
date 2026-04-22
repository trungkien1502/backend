#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const LEGACY_ALLOWED_DESTRUCTIVE_MIGRATIONS = new Set(
  (
    process.env.LEGACY_ALLOWED_DESTRUCTIVE_MIGRATIONS ||
    "20260310135427_update_schema"
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

function readDatabaseUrlFromEnvFile(appDir) {
  const envPath = path.join(appDir, ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing .env in ${appDir}`);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const line = content
    .split(/\r?\n/)
    .find((item) => item.trim().startsWith("DATABASE_URL="));

  if (!line) {
    throw new Error("DATABASE_URL is missing in .env");
  }

  return line
    .replace(/^DATABASE_URL=/, "")
    .trim()
    .replace(/^"/, "")
    .replace(/"$/, "");
}

function getMigrationDirs(migrationsRoot) {
  if (!fs.existsSync(migrationsRoot)) {
    return [];
  }

  return fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function findDangerousStatements(sqlContent) {
  const normalized = sqlContent.replace(/\r\n/g, "\n");
  const checks = [
    { name: "DROP TABLE", pattern: /\bDROP\s+TABLE\b/i },
    { name: "DROP COLUMN", pattern: /\bDROP\s+COLUMN\b/i },
    { name: "DROP DATABASE", pattern: /\bDROP\s+DATABASE\b/i },
    { name: "TRUNCATE", pattern: /\bTRUNCATE\b/i },
    { name: "DELETE FROM", pattern: /\bDELETE\s+FROM\b/i },
  ];

  const matches = [];
  for (const check of checks) {
    if (check.pattern.test(normalized)) {
      matches.push(check.name);
    }
  }
  return Array.from(new Set(matches));
}

async function getAppliedMigrations(connection) {
  try {
    const [rows] = await connection.query(
      "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL"
    );
    return new Set(rows.map((row) => row.migration_name));
  } catch (error) {
    const msg = String(error && error.message ? error.message : error);
    if (msg.includes("_prisma_migrations")) {
      // Fresh database: no migration table yet, treat all migrations as pending.
      return new Set();
    }
    throw error;
  }
}

async function main() {
  const appDir = process.env.APP_DIR || process.cwd();
  const databaseUrl =
    process.env.DATABASE_URL || readDatabaseUrlFromEnvFile(appDir);

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const applied = await getAppliedMigrations(connection);
    const migrationsRoot = path.join(appDir, "prisma", "migrations");
    const allMigrations = getMigrationDirs(migrationsRoot);
    const pending = allMigrations.filter((name) => !applied.has(name));

    const violations = [];
    for (const migrationName of pending) {
      const sqlPath = path.join(migrationsRoot, migrationName, "migration.sql");
      if (!fs.existsSync(sqlPath)) {
        continue;
      }
      const sql = fs.readFileSync(sqlPath, "utf8");
      const matches = findDangerousStatements(sql);
      if (matches.length > 0) {
        if (LEGACY_ALLOWED_DESTRUCTIVE_MIGRATIONS.has(migrationName)) {
          console.warn(
            `Skipping legacy destructive migration allowlisted by policy: ${migrationName}`
          );
          continue;
        }
        violations.push({
          migrationName,
          sqlPath,
          matches,
        });
      }
    }

    if (violations.length > 0) {
      console.error(
        "Blocked deploy: destructive SQL found in pending Prisma migrations."
      );
      for (const violation of violations) {
        console.error(
          `- ${violation.migrationName}: ${violation.matches.join(", ")} (${violation.sqlPath})`
        );
      }
      process.exit(1);
    }

    console.log(
      `Migration safety check passed: ${pending.length} pending migration(s), no destructive SQL found.`
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Migration safety check failed:", error.message || error);
  process.exit(1);
});
