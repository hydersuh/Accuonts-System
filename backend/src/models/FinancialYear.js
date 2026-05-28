import { query } from "../config/database.js";

class FinancialYear {
  static async findAll() {
    const result = await query(
      `SELECT * FROM FinancialYears ORDER BY StartDate DESC`,
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM FinancialYears WHERE FYID = $1`, [
      id,
    ]);
    return result.rows[0];
  }

  static async getActive() {
    const result = await query(
      `SELECT * FROM FinancialYears WHERE IsActive = true`,
    );
    return result.rows[0];
  }

  static async create(fyData, createdBy) {
    const { fyName, startDate, endDate, isActive, notes } = fyData;

    if (isActive) {
      await query(`UPDATE FinancialYears SET IsActive = false`);
    }

    const result = await query(
      `INSERT INTO FinancialYears (FYName, StartDate, EndDate, IsActive, Notes, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [fyName, startDate, endDate, isActive || false, notes, createdBy],
    );

    return result.rows[0];
  }

  static async update(id, fyData, updatedBy) {
    const { fyName, startDate, endDate, isActive, notes } = fyData;

    if (isActive) {
      await query(
        `UPDATE FinancialYears SET IsActive = false WHERE FYID != $1`,
        [id],
      );
    }

    const result = await query(
      `UPDATE FinancialYears  
       SET FYName = COALESCE($1, FYName), 
           StartDate = COALESCE($2, StartDate), 
           EndDate = COALESCE($3, EndDate), 
           IsActive = COALESCE($4, IsActive), 
           Notes = COALESCE($5, Notes), 
           UpdatedBy = $6, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE FYID = $7 RETURNING *`,
      [fyName, startDate, endDate, isActive, notes, updatedBy, id],
    );

    return result.rows[0];
  }

  static async close(id, closedBy) {
    const result = await query(
      `UPDATE FinancialYears  
       SET IsClosed = true, 
           ClosingDate = CURRENT_DATE, 
           ClosedBy = $1 
       WHERE FYID = $2 RETURNING *`,
      [closedBy, id],
    );

    return result.rows[0];
  }

  static async getOpeningBalances(fyId) {
    const result = await query(
      `SELECT ob.*, l.AccName, l.AccCode, sg.SubName as SubGroupName 
       FROM OpeningBalances ob 
       JOIN Ledgers l ON ob.AcNo = l.AcNo 
       LEFT JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
       WHERE ob.FYID = $1`,
      [fyId],
    );
    return result.rows;
  }

  static async setOpeningBalance(
    fyId,
    acNo,
    openingDebit,
    openingCredit,
    createdBy,
  ) {
    const result = await query(
      `INSERT INTO OpeningBalances (FYID, AcNo, OpeningDebit, OpeningCredit, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (FYID, AcNo)  
       DO UPDATE SET OpeningDebit = EXCLUDED.OpeningDebit, 
                     OpeningCredit = EXCLUDED.OpeningCredit, 
                     UpdatedAt = CURRENT_TIMESTAMP 
       RETURNING *`,
      [fyId, acNo, openingDebit || 0, openingCredit || 0, createdBy],
    );

    return result.rows[0];
  }
}

export default FinancialYear;
