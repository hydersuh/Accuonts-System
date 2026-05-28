import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/database.js";
import Ledger from "../models/Ledger.js";
import AuditService from "../services/auditService.js";
import { validateLedger } from "../middleware/validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all ledgers with hierarchy info
router.get("/", async (req, res) => {
  try {
    const { subgroupId, groupId, mainId, isBankAccount, search } = req.query;

    let sql = ` 
            SELECT  
                l.AcNo, l.AccName, l.AccCode, l.OpeningBalance, l.BalanceType, 
                l.IsBankAccount, l.BankName, l.AccountNumber, l.IFSCcode, 
                l.HasGST, l.GSTIN, l.Address, l.Phone, l.Email, 
                l.IsActive, l.Description, 
                sg.SubGroupID, sg.SubName as SubGroupName, 
                g.GroupID, g.GroupName, 
                sm.SubPrimID, sm.SubName as SubMainName, 
                m.PrimID, m.PrimName as MainName, 
                get_account_path(l.AcNo) as account_path 
            FROM Ledgers l 
            LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID AND sg.IsActive = true 
            LEFT JOIN Groups g ON sg.GroupID = g.GroupID AND g.IsActive = true 
            LEFT JOIN subMain sm ON g.SubPrimID = sm.SubPrimID AND sm.IsActive = true 


            LEFT JOIN Main m ON sm.PrimID = m.PrimID AND m.IsActive = true 
            WHERE l.IsActive = true 
        `;

    const params = [];
    let paramCount = 1;

    if (subgroupId) {
      sql += ` AND l.SubGroupID = $${paramCount++}`;
      params.push(subgroupId);
    }

    if (groupId) {
      sql += ` AND sg.GroupID = $${paramCount++}`;
      params.push(groupId);
    }

    if (mainId) {
      sql += ` AND m.PrimID = $${paramCount++}`;
      params.push(mainId);
    }

    if (isBankAccount !== undefined) {
      sql += ` AND l.IsBankAccount = $${paramCount++}`;
      params.push(isBankAccount === "true");
    }

    if (search) {
      sql += ` AND (l.AccName ILIKE $${paramCount++} OR l.AccCode ILIKE $${paramCount++})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY m.PrimCode, sm.SubCode, g.GroupCode, sg.SubCode, l.AccCode`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ledgers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single ledger with full hierarchy
router.get("/:id", async (req, res) => {
  try {
    const ledger = await Ledger.findById(req.params.id);

    if (!ledger) {
      return res.status(404).json({ error: "Ledger not found" });
    }

    // Get balance for current financial year
    const balanceResult = await query(
      ` 
            SELECT  
                COALESCE(SUM(CASE WHEN ed.Debit > 0 THEN ed.Debit ELSE 0 END), 0) as total_debit, 
                COALESCE(SUM(CASE WHEN ed.Credit > 0 THEN ed.Credit ELSE 0 END), 0) as total_credit 
            FROM EntryDetails ed 
            JOIN JournalEntries je ON ed.EntryID = je.EntryID 
            WHERE ed.AcNo = $1 AND je.IsCancelled = FALSE 
        `,
      [req.params.id],
    );

    const currentBalance =
      ledger.BalanceType === "Dr"
        ? ledger.OpeningBalance +
          parseFloat(balanceResult.rows[0].total_debit) -
          parseFloat(balanceResult.rows[0].total_credit)
        : ledger.OpeningBalance +
          parseFloat(balanceResult.rows[0].total_credit) -
          parseFloat(balanceResult.rows[0].total_debit);

    res.json({
      ...ledger,
      current_balance: currentBalance,
      total_debit: parseFloat(balanceResult.rows[0].total_debit),
      total_credit: parseFloat(balanceResult.rows[0].total_credit),
    });
  } catch (error) {
    console.error("Error fetching ledger:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new ledger
router.post(
  "/",
  authorize("admin", "accountant"),
  validateLedger,
  async (req, res) => {
    try {
      // Check if account code already exists
      const existing = await query(
        "SELECT AcNo FROM Ledgers WHERE AccCode = $1",
        [req.body.accCode],
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Account code already exists" });
      }

      const ledger = await Ledger.create(req.body, req.userId);

      await AuditService.log(
        req.userId,
        "CREATE_LEDGER",
        "Ledgers",
        ledger.AcNo,
        null,
        ledger,
        req.ip,
      );

      res.status(201).json(ledger);
    } catch (error) {
      console.error("Error creating ledger:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  },
);

// Update ledger
router.put(
  "/:id",
  authorize("admin", "accountant"),
  validateLedger,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get old values for audit
      const oldLedger = await Ledger.findById(id);
      if (!oldLedger) {
        return res.status(404).json({ error: "Ledger not found" });
      }

      const {
        accName,
        accCode,
        subGroupId,
        openingBalance,
        balanceType,
        address,
        phone,
        email,
        hasGst,
        gstin,
        isBankAccount,
        bankName,
        accountNumber,
        ifscCode,
        description,
      } = req.body;

      // Check if new code conflicts (excluding current ledger)
      const existing = await query(
        "SELECT AcNo FROM Ledgers WHERE AccCode = $1 AND AcNo != $2",
        [accCode, id],
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Account code already exists" });
      }

      const result = await query(
        ` 
            UPDATE Ledgers SET 
                AccName = COALESCE($1, AccName), 
                AccCode = COALESCE($2, AccCode), 
                SubGroupID = COALESCE($3, SubGroupID), 
                OpeningBalance = COALESCE($4, OpeningBalance), 
                BalanceType = COALESCE($5, BalanceType), 
                Address = COALESCE($6, Address), 
                Phone = COALESCE($7, Phone), 
                Email = COALESCE($8, Email), 
                HasGST = COALESCE($9, HasGST), 
                GSTIN = COALESCE($10, GSTIN), 
                IsBankAccount = COALESCE($11, IsBankAccount), 
                BankName = COALESCE($12, BankName), 
                AccountNumber = COALESCE($13, AccountNumber), 
                IFSCcode = COALESCE($14, IFSCcode), 
                Description = COALESCE($15, Description), 
                UpdatedAt = CURRENT_TIMESTAMP, 
                UpdatedBy = $16 
            WHERE AcNo = $17 
            RETURNING * 
        `,
        [
          accName,
          accCode,
          subGroupId,
          openingBalance,
          balanceType,
          address,
          phone,
          email,
          hasGst,
          gstin,
          isBankAccount,
          bankName,
          accountNumber,
          ifscCode,
          description,
          req.userId,
          id,
        ],
      );

      const updatedLedger = await Ledger.findById(id);

      await AuditService.log(
        req.userId,
        "UPDATE_LEDGER",
        "Ledgers",
        id,
        oldLedger,
        updatedLedger,
        req.ip,
      );

      res.json(updatedLedger);
    } catch (error) {
      console.error("Error updating ledger:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Delete (deactivate) ledger
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ledger has any transactions
    const transactions = await query(
      "SELECT COUNT(*) FROM EntryDetails WHERE AcNo = $1",
      [id],
    );

    if (parseInt(transactions.rows[0].count) > 0) {
      return res.status(400).json({
        error:
          "Cannot delete ledger with existing transactions. Deactivate instead.",
      });
    }

    const oldLedger = await Ledger.findById(id);

    await query(
      "UPDATE Ledgers SET IsActive = false, UpdatedBy = $1 WHERE AcNo = $2",
      [req.userId, id],
    );

    await AuditService.log(
      req.userId,
      "DELETE_LEDGER",
      "Ledgers",
      id,
      oldLedger,
      null,
      req.ip,
    );

    res.json({ message: "Ledger deactivated successfully" });
  } catch (error) {
    console.error("Error deleting ledger:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ledger statement with transactions
router.get("/:id/statement", async (req, res) => {
  try {
    const { id } = req.params;
    const { fromDate, toDate, fyId } = req.query;

    const ledger = await Ledger.findById(id);
    if (!ledger) {
      return res.status(404).json({ error: "Ledger not found" });
    }

    let dateCondition = "";
    const params = [id];
    let paramCount = 2;

    if (fromDate && toDate) {
      dateCondition = ` AND je.EntryDate BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(fromDate, toDate);
    } else if (fyId) {
      dateCondition = ` AND je.FYID = $${paramCount++}`;
      params.push(fyId);
    }

    const transactions = await query(
      ` 
            SELECT  
                je.EntryID, je.EntryDate, je.VoucherNo, je.Narration, 
                vt.VoucherName, vt.VoucherCode, 
                ed.DetailID, ed.Debit, ed.Credit, ed.Description, 
                u.FullName as CreatedByName 
            FROM EntryDetails ed 
            JOIN JournalEntries je ON ed.EntryID = je.EntryID 
            JOIN VoucherTypes vt ON je.VTypeID = vt.VTypeID 
            LEFT JOIN Users u ON je.CreatedBy = u.UserID 
            WHERE ed.AcNo = $1  
                AND je.IsCancelled = FALSE 
                ${dateCondition} 
            ORDER BY je.EntryDate ASC, je.EntryID ASC`,
      params,
    );

    // Calculate running balance
    let runningBalance = parseFloat(ledger.OpeningBalance);
    const transactionsWithBalance = transactions.rows.map((trans) => {
      if (ledger.BalanceType === "Dr") {
        runningBalance +=
          (parseFloat(trans.debit) || 0) - (parseFloat(trans.credit) || 0);
      } else {
        runningBalance +=
          (parseFloat(trans.credit) || 0) - (parseFloat(trans.debit) || 0);
      }

      return { ...trans, running_balance: runningBalance };
    });

    res.json({
      ledger,
      opening_balance: {
        amount: parseFloat(ledger.OpeningBalance),
        type: ledger.BalanceType,
      },
      transactions: transactionsWithBalance,
      closing_balance: {
        amount: runningBalance,
        type: ledger.BalanceType,
      },
    });
  } catch (error) {
    console.error("Error fetching ledger statement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ledgers by hierarchy level
router.get("/hierarchy/by-main/:mainId", async (req, res) => {
  try {
    const result = await query(
      ` 
            SELECT  
                l.AcNo, l.AccName, l.AccCode, 
                sg.SubGroupID, sg.SubName as subgroup_name, 
                g.GroupID, g.GroupName as group_name, 
                sm.SubPrimID, sm.SubName as submain_name 
            FROM Ledgers l 
            JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
            JOIN Groups g ON sg.GroupID = g.GroupID 
            JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
            WHERE sm.PrimID = $1 AND l.IsActive = true 
            ORDER BY sm.SubCode, g.GroupCode, sg.SubCode, l.AccCode 
        `,
      [req.params.mainId],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ledgers by main:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ledgers by subgroup
router.get("/by-subgroup/:subgroupId", async (req, res) => {
  try {
    const result = await query(
      `SELECT AcNo, AccName, AccCode, OpeningBalance, BalanceType, IsActive 
             FROM Ledgers  
             WHERE SubGroupID = $1 AND IsActive = true 
             ORDER BY AccCode`,
      [req.params.subgroupId],
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching ledgers by subgroup:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk import ledgers (admin only)
router.post("/bulk-import", authorize("admin"), async (req, res) => {
  try {
    const { ledgers } = req.body;

    if (!Array.isArray(ledgers) || ledgers.length === 0) {
      return res.status(400).json({ error: "Invalid ledgers data" });
    }

    const results = [];
    const errors = [];

    for (const ledgerData of ledgers) {
      try {
        const existing = await query(
          "SELECT AcNo FROM Ledgers WHERE AccCode = $1",
          [ledgerData.accCode],
        );

        if (existing.rows.length > 0) {
          errors.push({
            accCode: ledgerData.accCode,
            error: "Account code already exists",
          });
          continue;
        }

        const ledger = await Ledger.create(ledgerData, req.userId);
        results.push(ledger);
      } catch (error) {
        errors.push({ accCode: ledgerData.accCode, error: error.message });
      }
    }

    await AuditService.log(
      req.userId,
      "BULK_IMPORT_LEDGERS",
      "Ledgers",
      null,
      null,
      { imported: results.length, failed: errors.length },
      req.ip,
    );

    res.json({
      message: `Imported ${results.length} ledgers successfully`,
      success: results,
      errors: errors,
    });
  } catch (error) {
    console.error("Error bulk importing ledgers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
