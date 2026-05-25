import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { query } from "../config/database.js";
import AuditService from "../services/auditService.js";

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      const result = await query(
        "SELECT * FROM Users WHERE Username = $1 AND IsActive = true",
        [username],
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordhash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await query(
        "UPDATE Users SET LastLogin = CURRENT_TIMESTAMP WHERE UserID = $1",
        [user.userid],
      );

      // Create token
      const token = jwt.sign(
        { userId: user.userid, username: user.username, role: user.role },
        process.env.JWT_SECRET,

        { expiresIn: process.env.JWT_EXPIRE },
      );

      // Log audit
      await AuditService.log(
        user.userid,
        "LOGIN",
        "Users",
        user.userid,
        null,
        null,
        req.ip,
        req.headers["user-agent"],
      );

      res.json({
        token,
        user: {
          id: user.userid,
          username: user.username,
          email: user.email,
          fullName: user.fullname,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getProfile(req, res) {
    try {
      const result = await query(
        `SELECT UserID, Username, Email, FullName, Role, IsActive, LastLogin, CreatedAt  
                 FROM Users WHERE UserID = $1`,
        [req.userId],
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const userResult = await query(
        "SELECT PasswordHash FROM Users WHERE UserID = $1",
        [req.userId],
      );

      const isValid = await bcrypt.compare(
        oldPassword,
        userResult.rows[0].passwordhash,
      );
      if (!isValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await query(
        "UPDATE Users SET PasswordHash = $1, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = $2",
        [hashedPassword, req.userId],
      );

      await AuditService.log(
        req.userId,
        "CHANGE_PASSWORD",
        "Users",
        req.userId,
      );

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default AuthController;
