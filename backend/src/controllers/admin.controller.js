const mongoose = require("mongoose");

const { User } = require("../models/User");
const ClassModel = require("../models/Class");
const Student = require("../models/Student");
const createHttpError = require("../utils/httpError");

function mapClass(classDoc, studentCount = 0) {
  return {
    id: classDoc.id,
    classId: classDoc.id,
    className: classDoc.className,
    grade: classDoc.grade,
    academicYear: classDoc.academicYear,
    teacherId: classDoc.teacherId ? classDoc.teacherId.toString() : "",
    studentCount,
    isActive: classDoc.isActive,
    createdAt: classDoc.createdAt,
    updatedAt: classDoc.updatedAt,
  };
}

function mapUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listUsers(request, response, next) {
  try {
    const { role, search } = request.query;
    const query = {};

    if (role && ["teacher", "parent", "admin"].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    response.status(200).json({
      users: users.map(mapUser),
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(request, response, next) {
  try {
    const { fullName, email, password, phone, role } = request.body;

    if (!fullName || !email || !password || !role) {
      throw createHttpError(400, "fullName, email, password, and role are required");
    }

    if (!["teacher", "parent"].includes(role)) {
      throw createHttpError(400, "role must be teacher or parent");
    }

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || "",
      passwordHash: password,
      role,
    });

    response.status(201).json({
      user: mapUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createHttpError(409, "A user with this email already exists"));
      return;
    }

    next(error);
  }
}

async function updateUser(request, response, next) {
  try {
    const { id } = request.params;
    const { fullName, email, phone, role, isActive } = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid user id");
    }

    const user = await User.findById(id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    if (typeof fullName === "string" && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    if (typeof email === "string" && email.trim()) {
      user.email = email.trim().toLowerCase();
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    if (typeof role === "string" && ["teacher", "parent", "admin"].includes(role)) {
      user.role = role;
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    await user.save();

    response.status(200).json({
      user: mapUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      next(createHttpError(409, "A user with this email already exists"));
      return;
    }

    next(error);
  }
}

async function deleteUser(request, response, next) {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createHttpError(400, "Invalid user id");
    }

    const user = await User.findById(id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    user.isActive = false;
    await user.save();

    response.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
}

async function assignTeacherToClass(request, response, next) {
  try {
    const { classId } = request.params;
    const { teacherId } = request.body;

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw createHttpError(400, "Invalid class id");
    }

    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      throw createHttpError(400, "Valid teacherId is required");
    }

    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      isActive: true,
    });

    if (!teacher) {
      throw createHttpError(404, "Teacher not found");
    }

    const classDoc = await ClassModel.findOne({
      _id: classId,
      isActive: true,
    });

    if (!classDoc) {
      throw createHttpError(404, "Class not found");
    }

    classDoc.teacherId = teacherId;
    await classDoc.save();

    const studentCount = await Student.countDocuments({
      classId: classDoc._id,
      isActive: true,
    });

    response.status(200).json({
      class: mapClass(classDoc, studentCount),
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(request, response, next) {
  try {
    const [totalStudents, totalClasses, totalTeachers, totalParents] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      ClassModel.countDocuments({ isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      User.countDocuments({ role: "parent", isActive: true }),
    ]);

    response.status(200).json({
      stats: {
        totalStudents,
        totalClasses,
        totalTeachers,
        totalParents,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  assignTeacherToClass,
  getStats,
};
