import { query } from "../config/database.js";

class BaseModel {
  static async getFullHierarchy() {
    const result = await query(` 
            WITH RECURSIVE AccountHierarchy AS ( 
                SELECT  
                    PrimID as id, 
                    PrimName as name, 
                    PrimCode as code, 
                    'Main' as level, 
                    NULL as parent_id, 
                    PrimCode as sort_order, 
                    0 as level_depth 
                FROM Main WHERE IsActive = true 
                 
                UNION ALL 
                 
                SELECT  
                    sm.SubPrimID as id, 
                    sm.SubName as name, 
                    sm.SubCode as code, 
                    'SubMain' as level, 
                    sm.PrimID as parent_id, 
                    ah.sort_order || '.' || sm.SubCode as sort_order, 
                    ah.level_depth + 1 


                FROM subMain sm 
                JOIN AccountHierarchy ah ON sm.PrimID = ah.id 
                WHERE sm.IsActive = true AND ah.level = 'Main' 
                 
                UNION ALL 
                 
                SELECT  
                    g.GroupID as id, 
                    g.GroupName as name, 
                    g.GroupCode as code, 
                    'Group' as level, 
                    g.SubPrimID as parent_id, 
                    ah.sort_order || '.' || g.GroupCode as sort_order, 
                    ah.level_depth + 1 
                FROM Groups g 
                JOIN AccountHierarchy ah ON g.SubPrimID = ah.id 
                WHERE g.IsActive = true AND ah.level = 'SubMain' 
                 
                UNION ALL 
                 
                SELECT  
                    sg.SubGroupID as id, 
                    sg.SubName as name, 
                    sg.SubCode as code, 
                    'SubGroup' as level, 
                    sg.GroupID as parent_id, 
                    ah.sort_order || '.' || sg.SubCode as sort_order, 
                    ah.level_depth + 1 
                FROM SubGroups sg 
                JOIN AccountHierarchy ah ON sg.GroupID = ah.id 
                WHERE sg.IsActive = true AND ah.level = 'Group' 
                 
                UNION ALL 
                 
                SELECT  
                    l.AcNo as id, 
                    l.AccName as name, 
                    l.AccCode as code, 
                    'Ledger' as level, 


                    l.SubGroupID as parent_id, 
                    ah.sort_order || '.' || l.AccCode as sort_order, 
                    ah.level_depth + 1 
                FROM Ledgers l 
                JOIN AccountHierarchy ah ON l.SubGroupID = ah.id 
                WHERE l.IsActive = true AND ah.level = 'SubGroup' 
            ) 
            SELECT * FROM AccountHierarchy ORDER BY sort_order 
        `);
    return result.rows;
  }
}

export default BaseModel;
