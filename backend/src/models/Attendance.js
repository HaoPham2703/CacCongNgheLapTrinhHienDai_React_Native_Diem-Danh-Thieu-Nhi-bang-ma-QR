const mongoose = require("mongoose");

const ATTENDANCE_STATUSES = ["present", "late", "absent"];
const ATTENDANCE_SOURCES = ["QR", "manual"];

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
      default: "present",
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    source: {
      type: String,
      enum: ATTENDANCE_SOURCES,
      default: "QR",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ academicYear: 1, date: 1 });

module.exports = {
  Attendance: mongoose.model("Attendance", attendanceSchema),
  ATTENDANCE_STATUSES,
  ATTENDANCE_SOURCES,
};
