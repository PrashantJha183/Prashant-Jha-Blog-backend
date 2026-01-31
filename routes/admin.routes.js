import { Router } from "express";
import {
  createUserByAdmin,
  getAllStaff,
  updateUserByAdmin,
  deleteUserByAdmin,
} from "../controllers/admin.contoller.js";

import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/rbac.middleware.js";

const router = Router();

/* =========================
   ADMIN ONLY ROUTES
========================= */

router.use(protect, allowRoles("admin"));

router.post("/users", createUserByAdmin); // CREATE
router.get("/users", getAllStaff); // READ
router.put("/users/:id", updateUserByAdmin); // UPDATE
router.delete("/users/:id", deleteUserByAdmin); // DELETE

export default router;
