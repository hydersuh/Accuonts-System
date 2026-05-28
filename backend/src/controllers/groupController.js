import {
  MainGroup,
  SubMainGroup,
  Group,
  SubGroup,
} from "../models/GroupModels.js";
import AuditService from "../services/auditService.js";

class GroupController {
  // Main Group CRUD
  static async getMainGroups(req, res) {
    try {
      const groups = await MainGroup.findAll();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createMainGroup(req, res) {
    try {
      const group = await MainGroup.create(req.body, req.userId);

      await AuditService.log(
        req.userId,
        "CREATE_MAIN_GROUP",
        "Main",
        group.primid,
        null,
        group,
      );
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateMainGroup(req, res) {
    try {
      const group = await MainGroup.update(req.params.id, req.body, req.userId);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteMainGroup(req, res) {
    try {
      await MainGroup.delete(req.params.id, req.userId);
      res.json({ message: "Main group deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // SubMain Group CRUD
  static async getSubMainGroups(req, res) {
    try {
      const groups = await SubMainGroup.findAll();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSubMainByMain(req, res) {
    try {
      const groups = await SubMainGroup.findByMainId(req.params.mainId);

      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createSubMainGroup(req, res) {
    try {
      const group = await SubMainGroup.create(req.body, req.userId);
      await AuditService.log(
        req.userId,
        "CREATE_SUBMAIN_GROUP",
        "subMain",
        group.subprimid,
        null,
        group,
      );
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSubMainGroup(req, res) {
    try {
      const group = await SubMainGroup.update(
        req.params.id,
        req.body,
        req.userId,
      );
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteSubMainGroup(req, res) {
    try {
      await SubMainGroup.delete(req.params.id, req.userId);
      res.json({ message: "Sub-main group deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Group CRUD (Level 3)
  static async getGroups(req, res) {
    try {
      const groups = await Group.findAll();

      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getGroupBySubMain(req, res) {
    try {
      const groups = await Group.findBySubMainId(req.params.subMainId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createGroup(req, res) {
    try {
      const group = await Group.create(req.body, req.userId);
      await AuditService.log(
        req.userId,
        "CREATE_GROUP",
        "Groups",
        group.groupid,
        null,
        group,
      );
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateGroup(req, res) {
    try {
      const group = await Group.update(req.params.id, req.body, req.userId);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteGroup(req, res) {
    try {
      await Group.delete(req.params.id, req.userId);
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // SubGroup CRUD (Level 4)
  static async getSubGroups(req, res) {
    try {
      const groups = await SubGroup.findAll();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSubGroupByGroup(req, res) {
    try {
      const groups = await SubGroup.findByGroupId(req.params.groupId);
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createSubGroup(req, res) {
    try {
      const group = await SubGroup.create(req.body, req.userId);
      await AuditService.log(
        req.userId,
        "CREATE_SUBGROUP",
        "SubGroups",
        group.subgroupid,
        null,
        group,
      );
      res.status(201).json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateSubGroup(req, res) {
    try {
      const group = await SubGroup.update(req.params.id, req.body, req.userId);
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteSubGroup(req, res) {
    try {
      await SubGroup.delete(req.params.id, req.userId);
      res.json({ message: "Sub-group deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default GroupController;
