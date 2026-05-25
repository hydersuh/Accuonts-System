import { body, param, query, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateLedger = [
  body("accName").notEmpty().withMessage("Account name is required"),
  body("accCode").notEmpty().withMessage("Account code is required"),
  body("subGroupId").isInt().withMessage("Valid subgroup is required"),
  body("subGroupId").custom(async (value) => {
    const { query } = await import("../config/database.js");
    const result = await query(
      "SELECT * FROM SubGroups WHERE SubGroupID = $1 AND IsActive = true",
      [value],
    );
    if (result.rows.length === 0) {
      throw new Error("SubGroup does not exist or is inactive");
    }
    return true;
  }),
  body("openingBalance")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Opening balance must be a positive number"),
  body("balanceType")
    .optional()
    .isIn(["Dr", "Cr"])
    .withMessage("Balance type must be Dr or Cr"),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("gstin")
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage("Invalid GSTIN format"),
  validateRequest,
];

export const validateVoucher = [
  body("voucherTypeId").isInt().withMessage("Valid voucher type is required"),

  body("entryDate").isISO8601().withMessage("Valid date is required"),
  body("fyId").isInt().withMessage("Valid financial year is required"),
  body("narration").notEmpty().withMessage("Narration is required"),
  body("details")
    .isArray({ min: 2 })
    .withMessage("At least two entries required"),
  body("details.*.acNo").isInt().withMessage("Valid account required"),
  body("details.*.debit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Debit must be positive"),
  body("details.*.credit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Credit mustbe positive"),
  body("details").custom((details) => {
    const totalDr = details.reduce((sum, d) => sum + (d.debit || 0), 0);
    const totalCr = details.reduce((sum, d) => sum + (d.credit || 0), 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
      throw new Error("Total debit must equal total credit");
    }
    return true;
  }),
  validateRequest,
];

export const validateHierarchyItem = (level) => {
  const validators = {
    main: [
      body("primName").notEmpty().withMessage("Main group name is required"),
      body("primCode").notEmpty().withMessage("Main group code is required"),
    ],
    submain: [
      body("primId").isInt().withMessage("Valid parent main group is required"),
      body("subName").notEmpty().withMessage("Sub-main name is required"),
      body("subCode").notEmpty().withMessage("Sub-main code is required"),
    ],
    group: [
      body("subPrimId")
        .isInt()
        .withMessage("Valid parent sub-main is required"),
      body("groupName").notEmpty().withMessage("Group name is required"),
      body("groupCode").notEmpty().withMessage("Group code is required"),
    ],
    subgroup: [
      body("groupId").isInt().withMessage("Valid parent group is required"),
      body("subName").notEmpty().withMessage("Subgroup name is required"),
      body("subCode").notEmpty().withMessage("Subgroup code is required"),
    ],
  };
  return [...(validators[level] || []), validateRequest];
};
