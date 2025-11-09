import express from "express";
import {
  getBannedKeywords,
  addBannedKeyword,
  deleteBannedKeyword,
} from "../controllers/bannedKeywordController.js";
import protect from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, allowRoles("admin"), getBannedKeywords);
router.post("/", protect, allowRoles("admin"), addBannedKeyword);
router.delete("/:keywordId", protect, allowRoles("admin"), deleteBannedKeyword);

export default router;

