import express from "express";
import authRoutes from "./authRoutes.js";
// import ledgerRoutes from './ledgerRoutes.js';
// import voucherRoutes from './voucherRoutes.js';
// import reportRoutes from './reportRoutes.js';
// import groupRoutes from './groupRoutes.js';
// import settingsRoutes from './settingsRoutes.js';

const router = express.Router();

router.use("/auth", authRoutes);
// router.use('/ledgers', ledgerRoutes);
// router.use('/vouchers', voucherRoutes);
// router.use('/reports', reportRoutes);
// router.use('/groups', groupRoutes);
// router.use('/settings', settingsRoutes);

export default router;
