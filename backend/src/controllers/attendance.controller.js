const mongoose = require("mongoose");

const { Attendance, ATTENDANCE_STATUSES } = require("../models/Attendance");
const AttendanceSettings = require("../models/AttendanceSettings");
const { Notification } = require("../models/Notification");
const Student = require("../models/Student");
const createHttpError = require("../utils/httpError");
const { formatDateOnly } = require("../utils/date");

function mapAttendance(attendance) {
  const studentClass =
    attendance.studentId && attendance.studentId.classId && typeof attendance.studentId.classId === "object"
      ? attendance.studentId.classId
      : null;

  return {
    id: attendance.id,
    studentId: attendance.studentId?._id || attendance.studentId,
    student: attendance.studentId && attendance.studentId.fullName
      ? {
          id: attendance.studentId.id,
          studentCode: attendance.studentId.studentCode,
          fullName: attendance.studentId.fullName,
          classId: studentClass ? studentClass.id : attendance.studentId.classId?.toString?.() || "",
          className: studentClass ? studentClass.className : "",
        }
      : null,
    classId: attendance.classId?.toString?.() || attendance.classId,
    date: attendance.date,
    status: attendance.status,
    checkInTime: attendance.checkInTime,
    teacherId: attendance.teacherId,
    source: attendance.source,
    notes: attendance.notes,
    createdAt: attendance.createdAt,
    updatedAt: attendance.updatedAt,
  };
}

async function createAttendanceNotifications(attendance, student) {
  if (!student.parentIds.length) {
    return;
  }

  const notifications = student.parentIds.map((parentId) => ({
    userId: parentId,
    type: "attendance",
    title: "Attendance recorded",
    message: `${student.fullName} was checked in on ${attendance.date}`,
    refId: attendance._id,
  }));

  await Notification.insertMany(notifications);
}

async function checkInAttendance(request, response, next) {
  try {
    const { studentId, status = "present", notes = "", checkInTime: clientCheckInTime, attendanceDate: clientAttendanceDate } = request.body;

    console.log("📥 Check-in request:", { studentId, clientCheckInTime, clientAttendanceDate });

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw createHttpError(400, "A valid studentId is required");
    }

    if (!ATTENDANCE_STATUSES.includes(status)) {
      throw createHttpError(400, "Invalid attendance status");
    }

    const student = await Student.findOne({
      _id: studentId,
      isActive: true,
    });

    if (!student) {
      throw createHttpError(404, "Student not found");
    }

    const date = clientAttendanceDate || formatDateOnly();
    const checkInTime = clientCheckInTime ? new Date(clientCheckInTime) : new Date();

    console.log("⏰ Parsed checkInTime:", checkInTime.toISOString(), "Local:", checkInTime.toLocaleString());

    const settings = await AttendanceSettings.findOne();
    const schoolStartTime = settings?.schoolStartTime || "07:00";
    const gracePeriod = settings?.lateGracePeriodMinutes || 10;

    const [startHour, startMinute] = schoolStartTime.split(":").map(Number);
    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const checkInTotalMinutes = checkInHour * 60 + checkInMinute;
    const startTotalMinutes = startHour * 60 + startMinute;
    const lateThreshold = startTotalMinutes + gracePeriod;

    let finalStatus = status;
    if (status === "present" && checkInTotalMinutes > lateThreshold) {
      finalStatus = "late";
    }

    let attendance = await Attendance.findOne({
      studentId: student._id,
      date,
    });

    let wasCreated = false;

    if (attendance) {
      attendance.status = finalStatus;
      attendance.checkInTime = checkInTime;
      attendance.teacherId = request.authUser.id;
      attendance.classId = student.classId;
      attendance.source = "QR";
      attendance.notes = typeof notes === "string" ? notes.trim() : "";
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        studentId: student._id,
        classId: student.classId,
        date,
        status: finalStatus,
        checkInTime,
        teacherId: request.authUser.id,
        source: "QR",
        academicYear: new Date().getFullYear().toString(),
        notes: typeof notes === "string" ? notes.trim() : "",
      });
      wasCreated = true;
      await createAttendanceNotifications(attendance, student);
    }

    const populatedAttendance = await Attendance.findById(attendance._id).populate(
      "studentId",
      "studentCode fullName classId"
    );

    if (populatedAttendance?.studentId?.populate) {
      await populatedAttendance.populate("studentId.classId", "className grade academicYear");
    }

    response.status(wasCreated ? 201 : 200).json({
      attendance: mapAttendance(populatedAttendance),
      meta: {
        wasCreated,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createHttpError(409, "Attendance already exists for this student and date"));
      return;
    }

    next(error);
  }
}

async function getAccessibleAttendanceRecord(request, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, "Invalid attendance id");
  }

  const attendance = await Attendance.findById(id).populate(
    "studentId",
    "studentCode fullName classId parentIds"
  );

  if (attendance?.studentId?.populate) {
    await attendance.populate("studentId.classId", "className grade academicYear");
  }

  if (!attendance) {
    throw createHttpError(404, "Attendance not found");
  }

  if (
    request.authUser.role === "parent" &&
    (!attendance.studentId ||
      !attendance.studentId.parentIds.some(
        (parentId) => parentId.toString() === request.authUser.id
      ))
  ) {
    throw createHttpError(403, "You do not have permission to access this attendance record");
  }

  return attendance;
}

async function getTeacherAttendance(request, response, next) {
  try {
    const { classId, date = formatDateOnly() } = request.query;

    const query = { date };
    if (classId) {
      query.classId = classId.trim();
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("studentId", "studentCode fullName classId")
      .sort({ checkInTime: -1 });

    await Promise.all(
      attendanceRecords.map((record) =>
        record.studentId?.populate ? record.populate("studentId.classId", "className grade academicYear") : Promise.resolve(),
      ),
    );

    response.status(200).json({
      records: attendanceRecords.map(mapAttendance),
    });
  } catch (error) {
    next(error);
  }
}

async function getAdminAttendance(request, response, next) {
  try {
    const { classId, date, fromDate, toDate, status, studentCode } = request.query;
    const query = {};

    if (classId) {
      query.classId = classId.trim();
    }

    if (date) {
      query.date = date;
    } else if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        query.date.$gte = fromDate;
      }
      if (toDate) {
        query.date.$lte = toDate;
      }
    }

    if (status && ATTENDANCE_STATUSES.includes(status)) {
      query.status = status;
    }

    if (studentCode) {
      const matchedStudents = await Student.find({
        studentCode: { $regex: studentCode.trim(), $options: "i" },
      }).select("_id");
      query.studentId = { $in: matchedStudents.map((student) => student._id) };
    }

    const attendanceRecords = await Attendance.find(query)
      .populate("studentId", "studentCode fullName classId")
      .sort({ date: -1, checkInTime: -1 });

    await Promise.all(
      attendanceRecords.map((record) =>
        record.studentId?.populate
          ? record.populate("studentId.classId", "className grade academicYear")
          : Promise.resolve(),
      ),
    );

    response.status(200).json({
      records: attendanceRecords.map(mapAttendance),
    });
  } catch (error) {
    next(error);
  }
}

async function getParentAttendance(request, response, next) {
  try {
    const { studentId, fromDate, toDate } = request.query;

    const studentQuery = {
      parentIds: request.authUser.id,
      isActive: true,
    };

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw createHttpError(400, "Invalid studentId");
      }
      studentQuery._id = studentId;
    }

    const allowedStudents = await Student.find(studentQuery).select("_id");
    const allowedStudentIds = allowedStudents.map((student) => student._id);

    if (studentId && allowedStudentIds.length === 0) {
      throw createHttpError(403, "You do not have permission to access this student");
    }

    if (!allowedStudentIds.length) {
      response.status(200).json({ records: [] });
      return;
    }

    const attendanceQuery = {
      studentId: { $in: allowedStudentIds },
    };

    if (fromDate || toDate) {
      attendanceQuery.date = {};
      if (fromDate) {
        attendanceQuery.date.$gte = fromDate;
      }
      if (toDate) {
        attendanceQuery.date.$lte = toDate;
      }
    }

    const attendanceRecords = await Attendance.find(attendanceQuery)
      .populate("studentId", "studentCode fullName classId")
      .sort({ date: -1, checkInTime: -1 });

    await Promise.all(
      attendanceRecords.map((record) =>
        record.studentId?.populate ? record.populate("studentId.classId", "className grade academicYear") : Promise.resolve(),
      ),
    );

    response.status(200).json({
      records: attendanceRecords.map(mapAttendance),
    });
  } catch (error) {
    next(error);
  }
}

async function listAttendance(request, response, next) {
  if (request.authUser.role === "admin") {
    await getAdminAttendance(request, response, next);
    return;
  }

  if (request.authUser.role === "teacher") {
    await getTeacherAttendance(request, response, next);
    return;
  }

  await getParentAttendance(request, response, next);
}

async function getAttendanceById(request, response, next) {
  try {
    const attendance = await getAccessibleAttendanceRecord(request, request.params.id);

    response.status(200).json({
      attendance: mapAttendance(attendance),
    });
  } catch (error) {
    next(error);
  }
}

async function updateAttendance(request, response, next) {
  try {
    const attendance = await getAccessibleAttendanceRecord(request, request.params.id);
    const { status, notes } = request.body;

    if (status !== undefined) {
      if (!ATTENDANCE_STATUSES.includes(status)) {
        throw createHttpError(400, "Invalid attendance status");
      }
      attendance.status = status;
    }

    if (notes !== undefined) {
      if (typeof notes !== "string") {
        throw createHttpError(400, "notes must be a string");
      }
      attendance.notes = notes.trim();
    }

    attendance.teacherId = request.authUser.id;
    await attendance.save();

    response.status(200).json({
      attendance: mapAttendance(attendance),
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAttendance(request, response, next) {
  try {
    const attendance = await getAccessibleAttendanceRecord(request, request.params.id);

    await Promise.all([
      Attendance.deleteOne({ _id: attendance._id }),
      Notification.deleteMany({
        "payload.attendanceId": attendance._id,
      }),
    ]);

    response.status(200).json({
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkInAttendance,
  deleteAttendance,
  getAdminAttendance,
  getAttendanceById,
  getTeacherAttendance,
  getParentAttendance,
  listAttendance,
  updateAttendance,
};
