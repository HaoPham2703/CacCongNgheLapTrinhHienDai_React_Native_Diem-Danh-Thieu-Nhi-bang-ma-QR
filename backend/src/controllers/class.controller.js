const mongoose = require("mongoose");

const ClassModel = require("../models/Class");
const Student = require("../models/Student");
const { User } = require("../models/User");
const createHttpError = require("../utils/httpError");

function mapClass(classDoc, stats = {}) {
  return {
    id: classDoc.id,
    classId: classDoc.id,
    className: classDoc.className,
    grade: classDoc.grade,
    academicYear: classDoc.academicYear,
    teacherId: classDoc.teacherId ? classDoc.teacherId.toString() : "",
    studentCount: stats.studentCount ?? 0,
    isActive: classDoc.isActive,
    createdAt: classDoc.createdAt,
    updatedAt: classDoc.updatedAt,
  };
}

async function countStudentsByClass(classIds) {
  const rows = await Student.aggregate([
    {
      $match: {
        isActive: true,
        classId: { $in: classIds },
      },
    },
    {
      $group: {
        _id: "$classId",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

async function listClasses(request, response, next) {
  try {
    let classes;

    if (request.authUser.role === "teacher" || request.authUser.role === "admin") {
      const query = { isActive: true };

      if (request.query.teacherOnly === "true" && request.authUser.role === "teacher") {
        query.teacherId = request.authUser.id;
      }

      classes = await ClassModel.find(query).sort({ grade: 1, className: 1 });
    } else {
      const studentClassIds = await Student.distinct("classId", {
        parentIds: request.authUser.id,
        isActive: true,
      });

      classes = await ClassModel.find({
        _id: { $in: studentClassIds },
        isActive: true,
      }).sort({ grade: 1, className: 1 });
    }

    const studentCountMap = await countStudentsByClass(classes.map((classDoc) => classDoc._id));

    response.status(200).json({
      classes: classes.map((classDoc) =>
        mapClass(classDoc, { studentCount: studentCountMap.get(classDoc._id.toString()) || 0 }),
      ),
    });
  } catch (error) {
    next(error);
  }
}

async function getClassById(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid class id");
    }

    const classDoc = await ClassModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!classDoc) {
      throw createHttpError(404, "Class not found");
    }

    if (request.authUser.role === "parent") {
      const hasLinkedStudent = await Student.exists({
        classId: classDoc._id,
        parentIds: request.authUser.id,
        isActive: true,
      });

      if (!hasLinkedStudent) {
        throw createHttpError(403, "You do not have permission to access this class");
      }
    }

    const studentCountMap = await countStudentsByClass([classDoc._id]);

    response.status(200).json({
      class: mapClass(classDoc, { studentCount: studentCountMap.get(classDoc._id.toString()) || 0 }),
    });
  } catch (error) {
    next(error);
  }
}

async function createClass(request, response, next) {
  try {
    const { className, grade, academicYear, teacherId } = request.body;

    if (!className || !grade || !academicYear) {
      throw createHttpError(400, "className, grade, and academicYear are required");
    }

    let assignedTeacherId = request.authUser.id;

    if (request.authUser.role === "admin") {
      if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
        throw createHttpError(400, "Valid teacherId is required for admin");
      }

      const teacher = await User.findOne({
        _id: teacherId,
        role: "teacher",
        isActive: true,
      });

      if (!teacher) {
        throw createHttpError(404, "Teacher not found");
      }

      assignedTeacherId = teacher.id;
    }

    const classDoc = await ClassModel.create({
      className: className.trim(),
      grade: grade.trim(),
      academicYear: academicYear.trim(),
      teacherId: assignedTeacherId,
    });

    response.status(201).json({
      class: mapClass(classDoc, { studentCount: 0 }),
    });
  } catch (error) {
    next(error);
  }
}

async function updateClass(request, response, next) {
  try {
    const { id } = request.params;
    const { className, grade, teacherId, academicYear, isActive } = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid class id");
    }

    const classDoc = await ClassModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!classDoc) {
      throw createHttpError(404, "Class not found");
    }

    if (typeof className === "string" && className.trim()) {
      classDoc.className = className.trim();
    }

    if (typeof grade === "string" && grade.trim()) {
      classDoc.grade = grade.trim();
    }

    if (typeof academicYear === "string" && academicYear.trim()) {
      classDoc.academicYear = academicYear.trim();
    }

    if (typeof teacherId === "string") {
      if (!mongoose.Types.ObjectId.isValid(teacherId)) {
        throw createHttpError(400, "Invalid teacherId");
      }

      classDoc.teacherId = teacherId;
    }

    if (typeof isActive === "boolean") {
      classDoc.isActive = isActive;
    }

    await classDoc.save();

    const studentCountMap = await countStudentsByClass([classDoc._id]);

    response.status(200).json({
      class: mapClass(classDoc, { studentCount: studentCountMap.get(classDoc._id.toString()) || 0 }),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClasses,
  getClassById,
  createClass,
  updateClass,
};
