import { query } from "../config/database.js";
import FinancialYear from "../models/FinancialYear.js";
import AuditService from "../services/auditService.js";

class SettingsController {
  static async getCompanySettings(req, res) {
    try {
      const result = await query(
        `SELECT * FROM CompanySettings WHERE SettingID = 1`,
      );
      res.json(result.rows[0] || {});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateCompanySettings(req, res) {
    try {
      const {
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyGstin,
        companyPan,
        companyLogo,
        currency,
        fiscalYearStart,
      } = req.body;

      const result = await query(
        `INSERT INTO CompanySettings  
         (CompanyName, CompanyAddress, CompanyPhone, CompanyEmail,  
          CompanyGSTIN, CompanyPAN, CompanyLogo, Currency, FiscalYearStart, UpdatedBy) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (SettingID)  
         DO UPDATE SET  
           CompanyName = EXCLUDED.CompanyName, 
           CompanyAddress = EXCLUDED.CompanyAddress, 
           CompanyPhone = EXCLUDED.CompanyPhone, 
           CompanyEmail = EXCLUDED.CompanyEmail, 
           CompanyGSTIN = EXCLUDED.CompanyGSTIN, 
           CompanyPAN = EXCLUDED.CompanyPAN, 
           CompanyLogo = EXCLUDED.CompanyLogo, 
           Currency = EXCLUDED.Currency, 
           FiscalYearStart = EXCLUDED.FiscalYearStart, 
           UpdatedBy = EXCLUDED.UpdatedBy, 
           UpdatedAt = CURRENT_TIMESTAMP 
         RETURNING *`,
        [
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          companyGstin,
          companyPan,
          companyLogo,
          currency,
          fiscalYearStart,
          req.userId,
        ],
      );

      await AuditService.log(
        req.userId,
        "UPDATE_COMPANY_SETTINGS",
        "CompanySettings",
        1,
        null,
        result.rows[0],
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFinancialYears(req, res) {
    try {
      const years = await FinancialYear.findAll();
      res.json(years);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getActiveFinancialYear(req, res) {
    try {
      const year = await FinancialYear.getActive();
      res.json(year);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createFinancialYear(req, res) {
    try {
      const year = await FinancialYear.create(req.body, req.userId);
      await AuditService.log(
        req.userId,
        "CREATE_FINANCIAL_YEAR",
        "FinancialYears",
        year.fyid,
        null,
        year,
      );
      res.status(201).json(year);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateFinancialYear(req, res) {
    try {
      const year = await FinancialYear.update(
        req.params.id,
        req.body,
        req.userId,
      );
      res.json(year);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async closeFinancialYear(req, res) {
    try {
      const year = await FinancialYear.close(req.params.id, req.userId);
      res.json({ message: "Financial year closed successfully", year });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAuditLogs(req, res) {
    try {
      const {
        userId,
        tableName,
        action,
        fromDate,
        toDate,
        limit = 100,
        offset = 0,
      } = req.query;

      let sql = ` 
        SELECT a.*, u.Username, u.FullName 
        FROM AuditLog a 
        LEFT JOIN Users u ON a.UserID = u.UserID 
        WHERE 1=1 
      `;
      const params = [];
      let paramCount = 1;

      if (userId) {
        sql += ` AND a.UserID = $${paramCount++}`;
        params.push(userId);
      }
      if (tableName) {
        sql += ` AND a.TableName = $${paramCount++}`;
        params.push(tableName);
      }
      if (action) {
        sql += ` AND a.Action = $${paramCount++}`;
        params.push(action);
      }
      if (fromDate && toDate) {
        sql += ` AND a.Timestamp BETWEEN $${paramCount++} AND $${paramCount++}`;
        params.push(fromDate, toDate);
      }

      sql += ` ORDER BY a.Timestamp DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await query(sql, params);

      const countResult = await query(`SELECT COUNT(*) FROM AuditLog`);

      res.json({
        data: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].count),
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getBackupInfo(req, res) {
    try {
      const result = await query(` 
        SELECT  
          (SELECT COUNT(*) FROM Ledgers) as total_ledgers, 
          (SELECT COUNT(*) FROM JournalEntries WHERE IsCancelled = false) as total_vouchers, 
          (SELECT COUNT(*) FROM EntryDetails) as total_transactions, 
          (SELECT COUNT(*) FROM Users) as total_users, 
          (SELECT MAX(EntryDate) FROM JournalEntries) as last_transaction_date 
      `);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default SettingsController;
