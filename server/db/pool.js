const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

/** pg v8 warns when sslmode=require|prefer|verify-ca — normalize to verify-full explicitly. */
function normalizeDatabaseUrl(url) {
  return url.replace(
    /([?&])sslmode=(prefer|require|verify-ca)(&|$)/i,
    "$1sslmode=verify-full$2"
  );
}

const pool = new Pool({
  connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
