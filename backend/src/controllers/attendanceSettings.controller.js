const AttendanceSettings = require("../models/AttendanceSettings");
const createHttpError = require("../utils/httpError");

async function getAttendanceSettings(request, response, next) {
  try {
    let settings = await AttendanceSettings.findOne();

    if (!settings) {
      settings = await AttendanceSettings.create({
        schoolStartTime: "07:00",
        lateGracePeriodMinutes: 10,
      });
    }

    response.json({
      settings: {
        id: settings.id,
        schoolStartTime: settings.schoolStartTime,
        lateGracePeriodMinutes: settings.lateGracePeriodMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateAttendanceSettings(request, response, next) {
  try {
    const { schoolStartTime, lateGracePeriodMinutes } = request.body;

    if (!schoolStartTime || !/^\d{2}:\d{2}$/.test(schoolStartTime)) {
      throw createHttpError(400, "schoolStartTime must be in HH:MM format");
    }

    if (typeof lateGracePeriodMinutes !== "number" || lateGracePeriodMinutes < 0) {
      throw createHttpError(400, "lateGracePeriodMinutes must be a non-negative number");
    }

    let settings = await AttendanceSettings.findOne();

    if (!settings) {
      settings = await AttendanceSettings.create({
        schoolStartTime,
        lateGracePeriodMinutes,
      });
    } else {
      settings.schoolStartTime = schoolStartTime;
      settings.lateGracePeriodMinutes = lateGracePeriodMinutes;
      await settings.save();
    }

    response.json({
      settings: {
        id: settings.id,
        schoolStartTime: settings.schoolStartTime,
        lateGracePeriodMinutes: settings.lateGracePeriodMinutes,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendanceSettings,
  updateAttendanceSettings,
};
