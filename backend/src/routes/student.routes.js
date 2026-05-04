const express = require("express");

const {
  createStudent,
  deleteStudent,
  getStudentById,
  getMyChildren,
  listStudents,
  updateStudent,
} = require("../controllers/student.controller");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/roleCheck");

const router = express.Router();

router.use(authenticate);
router.get("/me/children", requireRole("parent"), getMyChildren);
router.get("/", requireRole("teacher", "admin"), listStudents);
router.post("/", requireRole("teacher", "admin"), createStudent);
router.get("/:id", requireRole("teacher", "parent", "admin"), getStudentById);
router.put("/:id", requireRole("teacher", "admin"), updateStudent);
router.delete("/:id", requireRole("teacher", "admin"), deleteStudent);

module.exports = router;
