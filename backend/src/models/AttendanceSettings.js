const mongoose = require("mongoose");

const attendanceSettingsSchema = new mongoose.Schema(
  {
    schoolStartTime: {
      type: String,
      required: true,
      default: "07:00",
    },
    lateGracePeriodMinutes: {
      type: Number,
      required: true,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AttendanceSettings", attendanceSettingsSchema);
