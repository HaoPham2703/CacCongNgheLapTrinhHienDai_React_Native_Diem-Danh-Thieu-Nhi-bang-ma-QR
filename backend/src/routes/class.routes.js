const express = require("express");

const {
  listClasses,
  getClassById,
  createClass,
  updateClass,
} = require("../controllers/class.controller");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

const router = express.Router();

router.use(authenticate);

router.get("/", requireRole("teacher", "parent", "admin"), listClasses);
router.get("/:id", requireRole("teacher", "parent", "admin"), getClassById);
router.post("/", requireRole("teacher", "admin"), createClass);
router.put("/:id", requireRole("teacher", "admin"), updateClass);

module.exports = router;
