const express = require("express");

const adminRoutes = require("./admin.routes");
const attendanceRoutes = require("./attendance.routes");
const authRoutes = require("./auth.routes");
const classRoutes = require("./class.routes");
const healthRoutes = require("./health.routes");
const notificationRoutes = require("./notification.routes");
const studentRoutes = require("./student.routes");
const userRoutes = require("./user.routes");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

const router = express.Router();

router.use("/admin", authenticate, requireRole("admin"), adminRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/auth", authRoutes);
router.use("/classes", classRoutes);
router.use("/health", healthRoutes);
router.use("/notifications", notificationRoutes);
router.use("/students", studentRoutes);
router.use("/users", userRoutes);

module.exports = router;
