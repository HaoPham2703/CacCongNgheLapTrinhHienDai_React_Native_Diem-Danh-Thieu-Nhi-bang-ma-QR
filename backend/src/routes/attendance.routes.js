const express = require("express");

const {
  checkInAttendance,
  deleteAttendance,
  getAttendanceById,
  getTeacherAttendance,
  getParentAttendance,
  listAttendance,
  updateAttendance,
} = require("../controllers/attendance.controller");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

const router = express.Router();

router.use(authenticate);
router.get("/", requireRole("teacher", "parent", "admin"), listAttendance);
router.post("/check-in", requireRole("teacher"), checkInAttendance);
router.get("/teacher", requireRole("teacher"), getTeacherAttendance);
router.get("/parent", requireRole("parent"), getParentAttendance);
router.get("/:id", requireRole("teacher", "parent", "admin"), getAttendanceById);
router.put("/:id", requireRole("teacher"), updateAttendance);
router.delete("/:id", requireRole("teacher", "admin"), deleteAttendance);

module.exports = router;
