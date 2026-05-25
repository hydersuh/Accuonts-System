import joi from "joi";

export const ledgerSchema = Joi.object({
  accName: Joi.string().required().max(255),
  accCode: Joi.string().required().max(50),
  subGroupId: Joi.number().integer().required(),
  openingBalance: Joi.number().min(0).default(0),
  balanceType: Joi.string().valid("Dr", "Cr").default("Dr"),
  address: Joi.string().optional().allow("", null),
  phone: Joi.string()
    .optional()
    .allow("", null)
    .pattern(/^[0-9+\-\s()]+$/)
    .message("Invalid phone number"),
  email: Joi.string().email().optional().allow("", null),
  hasGst: Joi.boolean().default(false),
  gstin: Joi.string().when("hasGst", {
    is: true,
    then: Joi.string()
      .required()
      .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/),
    otherwise: Joi.optional().allow("", null),
  }),
  isBankAccount: Joi.boolean().default(false),
  bankName: Joi.string().when("isBankAccount", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.optional().allow("", null),
  }),
  accountNumber: Joi.string().when("isBankAccount", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.optional().allow("", null),
  }),
  ifscCode: Joi.string().when("isBankAccount", {
    is: true,
    then: Joi.string()
      .required()
      .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/),
    otherwise: Joi.optional().allow("", null),
  }),
  description: Joi.string().optional().allow("", null),
});

export const journalEntrySchema = Joi.object({
  voucherTypeId: Joi.number().integer().required(),
  entryDate: Joi.date().required(),
  fyId: Joi.number().integer().required(),
  narration: Joi.string().required().min(3),
  details: Joi.array()
    .min(2)
    .items(
      Joi.object({
        acNo: Joi.number().integer().required(),
        debit: Joi.number().min(0).default(0),
        credit: Joi.number().min(0).default(0),
        description: Joi.string().optional().allow("", null),
      }),
    )
    .custom((details, helpers) => {
      const totalDr = details.reduce((sum, d) => sum + (d.debit || 0), 0);
      const totalCr = details.reduce((sum, d) => sum + (d.credit || 0), 0);
      if (Math.abs(totalDr - totalCr) > 0.01) {
        return helpers.error("any.invalid", {
          message: `Total debit (${totalDr}) must equal total credit (${
            totalCr
          })`,
        });
      }
      return details;
    }),
});

export const financialYearSchema = Joi.object({
  fyName: Joi.string()
    .required()
    .max(100)
    .pattern(/^\d{4}-\d{4}$/),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref("startDate")).required(),
  isActive: Joi.boolean().default(false),
  notes: Joi.string().optional().allow("", null),
});

export const mainGroupSchema = Joi.object({
  primName: Joi.string().required().max(255),
  primCode: Joi.string().required().max(20),
  description: Joi.string().optional().allow("", null),
});

export const subMainGroupSchema = Joi.object({
  primId: Joi.number().integer().required(),
  subName: Joi.string().required().max(255),
  subCode: Joi.string().required().max(20),
  description: Joi.string().optional().allow("", null),
});

export const groupSchema = Joi.object({
  subPrimId: Joi.number().integer().required(),
  groupName: Joi.string().required().max(255),
  groupCode: Joi.string().required().max(20),
  normalSide: Joi.string().valid("Dr", "Cr").default("Dr"),
  description: Joi.string().optional().allow("", null),
});

export const subGroupSchema = Joi.object({
  groupId: Joi.number().integer().required(),
  subName: Joi.string().required().max(255),
  subCode: Joi.string().required().max(20),
  normalSide: Joi.string().valid("Dr", "Cr").default("Dr"),
  description: Joi.string().optional().allow("", null),
});


