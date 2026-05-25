import { query } from "../config/database.js";

class AuditService {
  static async log(
    userId,
    action,
    tableName,
    recordId,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    userAgent = null,
  ) {
    try {
      await query(
        `INSERT INTO AuditLog (UserID, Action, TableName, RecordID, OldValue, 
NewValue, IPAddress, UserAgent) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          action,
          tableName,
          recordId,
          oldValue ? JSON.stringify(oldValue) : null,
          newValue ? JSON.stringify(newValue) : null,
          ipAddress,
          userAgent,
        ],
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }

  static async getAuditTrail(filters = {}) {
    let sql = ` 
            SELECT a.*, u.Username, u.FullName 
            FROM AuditLog a 
            LEFT JOIN Users u ON a.UserID = u.UserID 
            WHERE 1=1 
        `;

    const params = [];
    let paramCount = 1;

    if (filters.userId) {
      sql += ` AND a.UserID = $${paramCount++}`;
      params.push(filters.userId);
    }
    if (filters.tableName) {
      sql += ` AND a.TableName = $${paramCount++}`;
      params.push(filters.tableName);
    }
    if (filters.action) {
      sql += ` AND a.Action = $${paramCount++}`;
      params.push(filters.action);
    }
    if (filters.fromDate && filters.toDate) {
      sql += ` AND a.Timestamp BETWEEN $${paramCount++} AND $${paramCount++}`;
      params.push(filters.fromDate, filters.toDate);
    }

    sql += ` ORDER BY a.Timestamp DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }
}

export default AuditService;
