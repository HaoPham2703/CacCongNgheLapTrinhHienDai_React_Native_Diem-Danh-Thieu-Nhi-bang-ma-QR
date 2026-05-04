const express = require("express");

const {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notification.controller");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("parent"));

router.get("/", listNotifications);
router.patch("/read-all", markAllNotificationsAsRead);
router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
