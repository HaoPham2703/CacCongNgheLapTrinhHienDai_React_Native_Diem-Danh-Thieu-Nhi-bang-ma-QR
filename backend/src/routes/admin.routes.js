const express = require("express");

const {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  assignTeacherToClass,
  getStats,
} = require("../controllers/admin.controller");
const {
  getAttendanceSettings,
  updateAttendanceSettings,
} = require("../controllers/attendanceSettings.controller");

const router = express.Router();

router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/classes/:classId/assign-teacher", assignTeacherToClass);
router.get("/stats", getStats);
router.get("/attendance-settings", getAttendanceSettings);
router.put("/attendance-settings", updateAttendanceSettings);

module.exports = router;
