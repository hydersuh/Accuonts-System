import { query } from "../config/database.js";
import Ledger from "../models/Ledger.js";
import AuditService from "../services/auditService.js";

class LedgerController {
  static async getAllLedgers(req, res) {
    try {
      const { subgroupId, groupId, mainId, isBankAccount } = req.query;
      const ledgers = await Ledger.findAll({
        subgroupId,
        groupId,
        mainId,
        isBankAccount: isBankAccount === "true",
      });
      res.json(ledgers);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getLedgerById(req, res) {
    try {
      const ledger = await Ledger.findById(req.params.id);
      if (!ledger) {
        return res.status(404).json({ error: "Ledger not found" });
      }
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async createLedger(req, res) {
    try {
      const ledger = await Ledger.create(req.body, req.userId);
      await AuditService.log(
        req.userId,
        "CREATE_LEDGER",
        "Ledgers",
        ledger.acno,
        null,
        ledger,
        req.ip,
      );
      res.status(201).json(ledger);
    } catch (error) {
      console.error("Error creating ledger:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  static async updateLedger(req, res) {
    try {
      const { id } = req.params;
      const oldLedger = await Ledger.findById(id);

      const result = await query(
        `UPDATE Ledgers  
         SET AccName = COALESCE($1, AccName), 
             Address = COALESCE($2, Address), 
             Phone = COALESCE($3, Phone), 
             Email = COALESCE($4, Email), 
             HasGST = COALESCE($5, HasGST), 
             GSTIN = COALESCE($6, GSTIN), 
             IsBankAccount = COALESCE($7, IsBankAccount), 
             BankName = COALESCE($8, BankName), 
             AccountNumber = COALESCE($9, AccountNumber), 
             IFSCcode = COALESCE($10, IFSCcode), 
             Description = COALESCE($11, Description), 
             IsActive = COALESCE($12, IsActive), 
             UpdatedAt = CURRENT_TIMESTAMP, 


             UpdatedBy = $13 
         WHERE AcNo = $14 RETURNING *`,
        [
          req.body.accName,
          req.body.address,
          req.body.phone,
          req.body.email,
          req.body.hasGst,
          req.body.gstin,
          req.body.isBankAccount,
          req.body.bankName,
          req.body.accountNumber,
          req.body.ifscCode,
          req.body.description,
          req.body.isActive,
          req.userId,
          id,
        ],
      );

      await AuditService.log(
        req.userId,
        "UPDATE_LEDGER",
        "Ledgers",
        id,
        oldLedger,
        result.rows[0],
        req.ip,
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error updating ledger:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteLedger(req, res) {
    try {
      const { id } = req.params;
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

      res.json({ message: "Ledger deleted successfully" });
    } catch (error) {
      console.error("Error deleting ledger:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default LedgerController;
