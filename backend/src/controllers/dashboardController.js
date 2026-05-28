import { query } from "../config/database.js";

class DashboardController {
  static async getDashboardStats(req, res) {
    try {
      const { fyId } = req.query;

      // Get current year stats
      const statsResult = await query(
        ` 
                SELECT  
                    COALESCE(SUM(TotDr), 0) as total_transactions, 
                    COUNT(*) as total_vouchers, 
                    COUNT(DISTINCT CreatedBy) as active_users 
                FROM JournalEntries 
                WHERE FYID = $1 AND IsCancelled = FALSE 
            `,
        [fyId],
      );

      // Get ledger count by hierarchy
      const ledgerStats = await query(` 
                SELECT  
                    COUNT(*) as total_ledgers, 
                    COUNT(CASE WHEN IsBankAccount = true THEN 1 END) as bank_ledgers, 
                    COUNT(CASE WHEN HasGST = true THEN 1 END) as gst_ledgers 
                FROM Ledgers WHERE IsActive = true 
            `);

      // Get recent vouchers with hierarchy info
      const recentVouchers = await query(
        ` 
                SELECT  
                    je.EntryID, je.EntryDate, je.VoucherNo, je.Narration, je.TotDr, 


                    vt.VoucherName, u.FullName as CreatedByName, 
                    COUNT(ed.DetailID) as line_items 
                FROM JournalEntries je 
                JOIN VoucherTypes vt ON je.VTypeID = vt.VTypeID 
                LEFT JOIN Users u ON je.CreatedBy = u.UserID 
                LEFT JOIN EntryDetails ed ON je.EntryID = ed.EntryID 
                WHERE je.FYID = $1 AND je.IsCancelled = FALSE 
                GROUP BY je.EntryID, vt.VoucherName, u.FullName 
                ORDER BY je.CreatedAt DESC 
                LIMIT 10 
            `,
        [fyId],
      );

      // Get monthly summary with hierarchy
      const monthlySummary = await query(
        ` 
                WITH MonthlyData AS ( 
                    SELECT  
                        DATE_TRUNC('month', je.EntryDate) as month, 
                        SUM(CASE WHEN m.PrimName = 'Income' THEN ed.Credit ELSE 0 END
) as income, 
                        SUM(CASE WHEN m.PrimName = 'Expenses' THEN ed.Debit ELSE 0 EN
D) as expenses 
                    FROM EntryDetails ed 
                    JOIN JournalEntries je ON ed.EntryID = je.EntryID 
                    JOIN Ledgers l ON ed.AcNo = l.AcNo 
                    JOIN SubGroups sg ON l.SubGroupID = sg.SubGroupID 
                    JOIN Groups g ON sg.GroupID = g.GroupID 
                    JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
                    JOIN Main m ON sm.PrimID = m.PrimID 
                    WHERE je.FYID = $1 AND je.IsCancelled = FALSE 
                    GROUP BY DATE_TRUNC('month', je.EntryDate) 
                ) 
                SELECT  
                    TO_CHAR(month, 'Mon') as month_name, 
                    EXTRACT(MONTH FROM month) as month_num, 
                    COALESCE(income, 0) as income, 
                    COALESCE(expenses, 0) as expenses 
                FROM MonthlyData 
                ORDER BY month_num 
            `,
        [fyId],
      );

      // Get top ledgers by transaction volume
      const topLedgers = await query(
        ` 
                SELECT  
                    l.AcNo, l.AccName, l.AccCode, 
                    get_account_path(l.AcNo) as account_path, 
                    COALESCE(SUM(ed.Debit), 0) as total_debit, 
                    COALESCE(SUM(ed.Credit), 0) as total_credit, 
                    COUNT(ed.DetailID) as transaction_count 
                FROM EntryDetails ed 
                JOIN Ledgers l ON ed.AcNo = l.AcNo 
                JOIN JournalEntries je ON ed.EntryID = je.EntryID 
                WHERE je.FYID = $1 AND je.IsCancelled = FALSE 
                GROUP BY l.AcNo, l.AccName, l.AccCode 
                ORDER BY (COALESCE(SUM(ed.Debit), 0) + COALESCE(SUM(ed.Credit), 0)) D 
ESC 
                LIMIT 5 
            `,
        [fyId],
      );

      res.json({
        stats: {
          ...statsResult.rows[0],
          total_ledgers: ledgerStats.rows[0].total_ledgers,
          bank_ledgers: ledgerStats.rows[0].bank_ledgers,
          gst_ledgers: ledgerStats.rows[0].gst_ledgers,
        },
        recent_vouchers: recentVouchers.rows,
        monthly_summary: monthlySummary.rows,
        top_ledgers: topLedgers.rows,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default DashboardController;
