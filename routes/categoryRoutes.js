import express from "express";
import {
  getCategories,
  createCategory,
} from "../controllers/categoryController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories); // Public route
router.post("/", protect, createCategory); // Users can create custom categories

export default router;

