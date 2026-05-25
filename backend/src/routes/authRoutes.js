import express from "express";
import { body } from "express-validator";
import AuthController from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";

const router = express.Router();

// Validation rules for login
const loginValidation = [
  body("username").notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

// Validation rules for change password
const changePasswordValidation = [
  body("oldPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
  validateRequest,
];

// Public routes
router.post("/login", AuthController.login);

// Protected routes (require authentication)
router.use(authenticate);

router.get("/profile", AuthController.getProfile);
router.post(
  "/change-password",
  changePasswordValidation,
  AuthController.changePassword,
);

// Admin only routes
router.get("/users", async (req, res) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { query } = await import("../config/database.js");
  const result = await query(
    "SELECT UserID, Username, Email, FullName, Role, IsActive, LastLogin, CreatedAt FROM Users",
  );
  res.json(result.rows);
});

router.post("/users", async (req, res) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const { username, password, email, fullName, role } = req.body;
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);
  const { query } = await import("../config/database.js");
  const result = await query(
    `INSERT INTO Users (Username, PasswordHash, Email, FullName, Role, CreatedBy)  
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING UserID, Username, Email, FullName, Role`,
    [username, hashedPassword, email, fullName, role || "user", req.userId],
  );
  res.status(201).json(result.rows[0]);
});

router.put("/users/:id/toggle-status", async (req, res) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { query } = await import("../config/database.js");
  const result = await query(
    `UPDATE Users SET IsActive = NOT IsActive, UpdatedBy = $1  
         WHERE UserID = $2 RETURNING UserID, IsActive`,
    [req.userId, req.params.id],
  );
  res.json(result.rows[0]);
});

export default router;
