const mongoose = require("mongoose");

const ClassModel = require("../models/Class");
const Student = require("../models/Student");
const { User } = require("../models/User");
const createHttpError = require("../utils/httpError");

function mapStudent(student, classDoc) {
  const resolvedClass =
    classDoc || (student.classId && typeof student.classId === "object" ? student.classId : null);

  return {
    id: student.id,
    studentCode: student.studentCode,
    fullName: student.fullName,
    classId: resolvedClass ? resolvedClass.id : typeof student.classId === "string" ? student.classId : "",
    className: resolvedClass ? resolvedClass.className : "",
    parentIds: student.parentIds.map((parentId) => parentId.toString()),
    dateOfBirth: student.dateOfBirth,
    gender: student.gender,
    address: student.address,
    avatar: student.avatar,
    status: student.status,
    isActive: student.isActive,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
}

async function validateParentIds(parentIds) {
  if (!Array.isArray(parentIds) || parentIds.length === 0) {
    throw createHttpError(400, "parentIds must be a non-empty array");
  }

  const invalidId = parentIds.find((parentId) => !mongoose.Types.ObjectId.isValid(parentId));
  if (invalidId) {
    throw createHttpError(400, "parentIds contains an invalid user id");
  }

  const parents = await User.find({
    _id: { $in: parentIds },
    role: "parent",
    isActive: true,
  }).select("_id");

  if (parents.length !== parentIds.length) {
    throw createHttpError(400, "Some parentIds do not match active parent users");
  }

  return parents.map((parent) => parent._id);
}

async function resolveClass(classId) {
  if (!classId || typeof classId !== "string" || !mongoose.Types.ObjectId.isValid(classId)) {
    throw createHttpError(400, "classId must be a valid class id");
  }

  const classDoc = await ClassModel.findOne({
    _id: classId,
    isActive: true,
  });

  if (!classDoc) {
    throw createHttpError(404, "Class not found");
  }

  return classDoc;
}

function normalizeDateOfBirth(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createHttpError(400, "dateOfBirth must be a valid date");
  }

  return date;
}

function normalizeGender(value) {
  if (!["male", "female", "other"].includes(value)) {
    throw createHttpError(400, "gender must be one of male, female, or other");
  }

  return value;
}

function normalizeStatus(value) {
  if (!["active", "graduated", "transferred"].includes(value)) {
    throw createHttpError(400, "status must be one of active, graduated, or transferred");
  }

  return value;
}

async function getStudentById(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid student id");
    }

    const student = await Student.findOne({
      _id: id,
      isActive: true,
    }).populate("classId", "className grade academicYear");

    if (!student) {
      throw createHttpError(404, "Student not found");
    }

    if (
      request.authUser.role === "parent" &&
      !student.parentIds.some((parentId) => parentId.toString() === request.authUser.id)
    ) {
      throw createHttpError(403, "You do not have permission to access this student");
    }

    response.status(200).json({
      student: mapStudent(student),
    });
  } catch (error) {
    next(error);
  }
}

async function getMyChildren(request, response, next) {
  try {
    const students = await Student.find({
      parentIds: request.authUser.id,
      isActive: true,
    })
      .populate("classId", "className grade academicYear")
      .sort({ fullName: 1 });

    response.status(200).json({
      students: students.map((student) => mapStudent(student)),
    });
  } catch (error) {
    next(error);
  }
}

async function listStudents(request, response, next) {
  try {
    const query = {
      isActive: true,
    };

    if (request.query.classId) {
      if (!mongoose.Types.ObjectId.isValid(request.query.classId)) {
        throw createHttpError(400, "Invalid classId");
      }

      query.classId = request.query.classId;
    }

    const students = await Student.find(query)
      .populate("classId", "className grade academicYear")
      .sort({ fullName: 1 });

    response.status(200).json({
      students: students.map((student) => mapStudent(student)),
    });
  } catch (error) {
    next(error);
  }
}

async function createStudent(request, response, next) {
  try {
    const {
      studentCode,
      fullName,
      classId,
      parentIds,
      dateOfBirth,
      gender,
      address = "",
      avatar = "",
      status = "active",
    } = request.body;

    if (!studentCode || !fullName || !classId || !dateOfBirth || !gender) {
      throw createHttpError(400, "studentCode, fullName, classId, dateOfBirth, and gender are required");
    }

    const classDoc = await resolveClass(classId);
    const normalizedParentIds = await validateParentIds(parentIds);

    const student = await Student.create({
      studentCode: studentCode.trim(),
      fullName: fullName.trim(),
      classId: classDoc._id,
      parentIds: normalizedParentIds,
      dateOfBirth: normalizeDateOfBirth(dateOfBirth),
      gender: normalizeGender(gender),
      address: typeof address === "string" ? address.trim() : "",
      avatar: typeof avatar === "string" ? avatar.trim() : "",
      status: normalizeStatus(status),
    });

    const populatedStudent = await Student.findById(student._id).populate("classId", "className grade academicYear");

    response.status(201).json({
      student: mapStudent(populatedStudent),
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createHttpError(409, "A student with this studentCode already exists"));
      return;
    }

    next(error);
  }
}

async function updateStudent(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid student id");
    }

    const student = await Student.findOne({
      _id: id,
      isActive: true,
    });

    if (!student) {
      throw createHttpError(404, "Student not found");
    }

    if (typeof request.body.studentCode === "string" && request.body.studentCode.trim()) {
      student.studentCode = request.body.studentCode.trim();
    }

    if (typeof request.body.fullName === "string" && request.body.fullName.trim()) {
      student.fullName = request.body.fullName.trim();
    }

    if (Array.isArray(request.body.parentIds)) {
      student.parentIds = await validateParentIds(request.body.parentIds);
    }

    if (typeof request.body.classId === "string" && request.body.classId.trim()) {
      const classDoc = await resolveClass(request.body.classId.trim());
      student.classId = classDoc._id;
    }

    if (request.body.dateOfBirth !== undefined) {
      student.dateOfBirth = normalizeDateOfBirth(request.body.dateOfBirth);
    }

    if (request.body.gender !== undefined) {
      student.gender = normalizeGender(request.body.gender);
    }

    if (typeof request.body.address === "string") {
      student.address = request.body.address.trim();
    }

    if (typeof request.body.avatar === "string") {
      student.avatar = request.body.avatar.trim();
    }

    if (request.body.status !== undefined) {
      student.status = normalizeStatus(request.body.status);
    }

    if (typeof request.body.isActive === "boolean") {
      student.isActive = request.body.isActive;
    }

    await student.save();

    const populatedStudent = await Student.findById(student._id).populate("classId", "className grade academicYear");

    response.status(200).json({
      student: mapStudent(populatedStudent),
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createHttpError(409, "A student with this studentCode already exists"));
      return;
    }

    next(error);
  }
}

async function deleteStudent(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid student id");
    }

    const student = await Student.findOne({
      _id: id,
      isActive: true,
    });

    if (!student) {
      throw createHttpError(404, "Student not found");
    }

    student.isActive = false;
    await student.save();

    response.status(200).json({
      message: "Student deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createStudent,
  deleteStudent,
  getStudentById,
  getMyChildren,
  listStudents,
  updateStudent,
};
