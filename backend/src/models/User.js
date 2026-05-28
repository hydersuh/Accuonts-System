import { query } from "../config/database.js";
import bcrypt from "bcrypt";

class User {
  static async findAll(filters = {}) {
    let sql = ` 
      SELECT UserID, Username, Email, FullName, Role, IsActive,  
             LastLogin, CreatedAt, UpdatedAt 
      FROM Users WHERE 1=1 
    `;
    const params = [];

    if (filters.isActive !== undefined) {
      sql += ` AND IsActive = $${params.length + 1}`;
      params.push(filters.isActive);
    }

    if (filters.role) {
      sql += ` AND Role = $${params.length + 1}`;
      params.push(filters.role);
    }

    sql += ` ORDER BY FullName`;

    const result = await query(sql, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT UserID, Username, Email, FullName, Role, IsActive,  
              LastLogin, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy 
       FROM Users WHERE UserID = $1`,
      [id],
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await query(`SELECT * FROM Users WHERE Username = $1`, [
      username,
    ]);
    return result.rows[0];
  }

  static async create(userData, createdBy) {
    const { username, password, email, fullName, role = "user" } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING  
       UserID, Username, Email, FullName, Role, IsActive, CreatedAt`,
      [username, hashedPassword, email, fullName, role, createdBy],
    );

    return result.rows[0];
  }

  static async update(id, userData, updatedBy) {
    const { email, fullName, role, isActive } = userData;

    const result = await query(
      `UPDATE Users  


       SET Email = COALESCE($1, Email), 
           FullName = COALESCE($2, FullName), 
           Role = COALESCE($3, Role), 
           IsActive = COALESCE($4, IsActive), 
           UpdatedBy = $5, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE UserID = $6 RETURNING  
       UserID, Username, Email, FullName, Role, IsActive`,
      [email, fullName, role, isActive, updatedBy, id],
    );

    return result.rows[0];
  }

  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE Users SET PasswordHash = $1, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE UserID = $2`,
      [hashedPassword, id],
    );

    return true;
  }

  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.passwordhash);
  }
}

export default User;
