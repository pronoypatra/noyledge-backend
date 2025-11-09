import express from "express";
import {
  createReport,
  getReports,
  fixReport,
  ignoreReport,
  deleteReport,
  autoExpireReports,
} from "../controllers/reportController.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, createReport);
router.get("/", protect, allowRoles("admin"), getReports);
router.put("/:reportId/fix", protect, allowRoles("admin"), fixReport);
router.put("/:reportId/ignore", protect, allowRoles("admin"), ignoreReport);
router.delete("/:reportId", protect, allowRoles("admin"), deleteReport);
router.post("/expire", protect, allowRoles("admin"), autoExpireReports);

export default router;

