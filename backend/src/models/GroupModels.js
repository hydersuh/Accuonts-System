import { query } from "../config/database.js";

export class MainGroup {
  static async findAll() {
    const result = await query(
      `SELECT * FROM Main WHERE IsActive = true ORDER BY PrimCode`,
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM Main WHERE PrimID = $1 AND IsActive = true`,
      [id],
    );
    return result.rows[0];
  }

  static async create(data, createdBy) {
    const { primName, primCode, description } = data;
    const result = await query(
      `INSERT INTO Main (PrimName, PrimCode, Description, CreatedBy) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [primName, primCode, description, createdBy],
    );
    return result.rows[0];
  }

  static async update(id, data, updatedBy) {
    const { primName, primCode, description } = data;
    const result = await query(
      `UPDATE Main  
       SET PrimName = COALESCE($1, PrimName), 
           PrimCode = COALESCE($2, PrimCode), 
           Description = COALESCE($3, Description), 
           UpdatedBy = $4, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE PrimID = $5 RETURNING *`,
      [primName, primCode, description, updatedBy, id],
    );
    return result.rows[0];
  }

  static async delete(id, updatedBy) {
    const result = await query(
      `UPDATE Main SET IsActive = false, UpdatedBy = $1 WHERE PrimID = $2 RETURNING *
`,
      [updatedBy, id],
    );
    return result.rows[0];
  }
}

export class SubMainGroup {
  static async findAll() {
    const result = await query(
      `SELECT sm.*, m.PrimName as MainName 
       FROM subMain sm 
       JOIN Main m ON sm.PrimID = m.PrimID 
       WHERE sm.IsActive = true 
       ORDER BY sm.SubCode`,
    );
    return result.rows;
  }

  static async findByMainId(mainId) {
    const result = await query(
      `SELECT * FROM subMain WHERE PrimID = $1 AND IsActive = true ORDER BY SubCode`,
      [mainId],
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM subMain WHERE SubPrimID = $1 AND IsActive = true`,
      [id],
    );
    return result.rows[0];
  }

  static async create(data, createdBy) {
    const { primId, subName, subCode, description } = data;
    const result = await query(
      `INSERT INTO subMain (PrimID, SubName, SubCode, Description, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [primId, subName, subCode, description, createdBy],
    );
    return result.rows[0];
  }

  static async update(id, data, updatedBy) {
    const { primId, subName, subCode, description } = data;
    const result = await query(
      `UPDATE subMain  
       SET PrimID = COALESCE($1, PrimID), 
           SubName = COALESCE($2, SubName), 
           SubCode = COALESCE($3, SubCode), 
           Description = COALESCE($4, Description), 
           UpdatedBy = $5, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE SubPrimID = $6 RETURNING *`,
      [primId, subName, subCode, description, updatedBy, id],
    );
    return result.rows[0];
  }

  static async delete(id, updatedBy) {
    const result = await query(
      `UPDATE subMain SET IsActive = false, UpdatedBy = $1 WHERE SubPrimID = $2 RETURNING *`,
      [updatedBy, id],
    );
    return result.rows[0];
  }
}

export class Group {
  static async findAll() {
    const result = await query(
      `SELECT g.*, sm.SubName as SubMainName, m.PrimName as MainName 


       FROM Groups g 
       JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
       JOIN Main m ON sm.PrimID = m.PrimID 
       WHERE g.IsActive = true 
       ORDER BY g.GroupCode`,
    );
    return result.rows;
  }

  static async findBySubMainId(subMainId) {
    const result = await query(
      `SELECT * FROM Groups WHERE SubPrimID = $1 AND IsActive = true ORDER BY GroupCode`,
      [subMainId],
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM Groups WHERE GroupID = $1 AND IsActive = true`,
      [id],
    );
    return result.rows[0];
  }

  static async create(data, createdBy) {
    const { subPrimId, groupName, groupCode, normalSide, description } = data;
    const result = await query(
      `INSERT INTO Groups (SubPrimID, GroupName, GroupCode, NormalSide, Description, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        subPrimId,
        groupName,
        groupCode,
        normalSide || "Dr",
        description,
        createdBy,
      ],
    );
    return result.rows[0];
  }

  static async update(id, data, updatedBy) {
    const { subPrimId, groupName, groupCode, normalSide, description } = data;

    const result = await query(
      `UPDATE Groups  
       SET SubPrimID = COALESCE($1, SubPrimID), 
           GroupName = COALESCE($2, GroupName), 
           GroupCode = COALESCE($3, GroupCode), 
           NormalSide = COALESCE($4, NormalSide), 
           Description = COALESCE($5, Description), 
           UpdatedBy = $6, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE GroupID = $7 RETURNING *`,
      [subPrimId, groupName, groupCode, normalSide, description, updatedBy, id],
    );
    return result.rows[0];
  }

  static async delete(id, updatedBy) {
    const result = await query(
      `UPDATE Groups SET IsActive = false, UpdatedBy = $1 WHERE GroupID = $2 RETURNIN
G *`,
      [updatedBy, id],
    );
    return result.rows[0];
  }
}

export class SubGroup {
  static async findAll() {
    const result = await query(
      `SELECT sg.*, g.GroupName as ParentGroup, g.NormalSide as GroupNormalSide, 
              sm.SubName as SubMainName, m.PrimName as MainName 
       FROM SubGroups sg 
       JOIN Groups g ON sg.GroupID = g.GroupID 
       JOIN subMain sm ON g.SubPrimID = sm.SubPrimID 
       JOIN Main m ON sm.PrimID = m.PrimID 
       WHERE sg.IsActive = true 
       ORDER BY sg.SubCode`,
    );
    return result.rows;
  }

  static async findByGroupId(groupId) {
    const result = await query(
      `SELECT * FROM SubGroups WHERE GroupID = $1 AND IsActive = true ORDER BY SubCode`,
      [groupId],
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM SubGroups WHERE SubGroupID = $1 AND IsActive = true`,
      [id],
    );
    return result.rows[0];
  }

  static async create(data, createdBy) {
    const { groupId, subName, subCode, normalSide, description } = data;
    const result = await query(
      `INSERT INTO SubGroups (GroupID, SubName, SubCode, NormalSide, Description, CreatedBy) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [groupId, subName, subCode, normalSide || "Dr", description, createdBy],
    );
    return result.rows[0];
  }

  static async update(id, data, updatedBy) {
    const { groupId, subName, subCode, normalSide, description } = data;
    const result = await query(
      `UPDATE SubGroups  
       SET GroupID = COALESCE($1, GroupID), 
           SubName = COALESCE($2, SubName), 
           SubCode = COALESCE($3, SubCode), 
           NormalSide = COALESCE($4, NormalSide), 
           Description = COALESCE($5, Description), 
           UpdatedBy = $6, 
           UpdatedAt = CURRENT_TIMESTAMP 
       WHERE SubGroupID = $7 RETURNING *`,
      [groupId, subName, subCode, normalSide, description, updatedBy, id],
    );
    return result.rows[0];
  }

  static async delete(id, updatedBy) {
    const result = await query(
      `UPDATE SubGroups SET IsActive = false, UpdatedBy = $1 WHERE SubGroupID = $2 RETURNING *`,
      [updatedBy, id],
    );
    return result.rows[0];
  }
}
