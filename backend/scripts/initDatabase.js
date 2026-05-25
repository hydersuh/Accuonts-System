import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Client } = pg;

async function initDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "accounting_system",
  });

  try {
    await client.connect();
    console.log("Connected to database");

    const schemaPath = path.join(__dirname, "../database/complete_schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing schema...");

    // CRITICAL: Execute the entire SQL file as one command
    // Do NOT split by semicolons - PostgreSQL handles multiple statements
    await client.query(sql);

    console.log("Database initialized successfully!");

    // Verify tables were created
    const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

    console.log("\nCreated tables:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });
  } catch (err) {
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    await client.end();
  }
}

initDatabase().catch(console.error);
