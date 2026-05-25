import bcrypt from "bcrypt";
import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function resetAdminPassword() {
  try {
    const newPassword = "admin123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE users SET passwordhash = $1 WHERE username = $2 RETURNING username",
      [hashedPassword, "admin"],
    );

    if (result.rows.length > 0) {
      console.log(`✅ Password for 'admin' has been reset to: ${newPassword}`);
      console.log(`Hash: ${hashedPassword}`);
      console.log(`\nYou can now login with:`);
      console.log(`Username: admin`);
      console.log(`Password: ${newPassword}`);
    } else {
      console.log("❌ User 'admin' not found");
    }

    await pool.end();
    process.exit();
  } catch (error) {
    console.error("Error resetting password:", error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();
