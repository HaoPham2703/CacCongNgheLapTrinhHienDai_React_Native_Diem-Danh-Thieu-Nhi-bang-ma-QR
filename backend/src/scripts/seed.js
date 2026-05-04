const { loadEnv, getRequiredEnv } = require("../config/env");
const connectDatabase = require("../config/database");
const { Attendance } = require("../models/Attendance");
const ClassModel = require("../models/Class");
const { Notification } = require("../models/Notification");
const { User } = require("../models/User");
const Student = require("../models/Student");

loadEnv();

async function seed() {
  await connectDatabase(getRequiredEnv("MONGODB_URI"));

  await Notification.db.dropDatabase();

  const teacher = await User.create({
    fullName: "Teacher Demo",
    email: "teacher@classpulse.local",
    phone: "0900000001",
    passwordHash: "Password123!",
    role: "teacher",
  });

  const parent = await User.create({
    fullName: "Parent Demo",
    email: "parent@classpulse.local",
    phone: "0900000002",
    passwordHash: "Password123!",
    role: "parent",
  });

  const admin = await User.create({
    fullName: "Admin Demo",
    email: "admin@classpulse.local",
    phone: "0900000003",
    passwordHash: "Password123!",
    role: "admin",
  });

  const classDoc = await ClassModel.create({
    className: "Lớp 1A",
    grade: "1",
    academicYear: "2026-2027",
    teacherId: teacher._id,
  });

  const students = [];

  for (const [index, payload] of [
    { studentCode: "HS001", fullName: "Nguyen Van An", gender: "male" },
    { studentCode: "HS002", fullName: "Tran Minh Chau", gender: "female" },
    { studentCode: "HS003", fullName: "Le Gia Huy", gender: "male" },
    { studentCode: "HS004", fullName: "Pham Bao Linh", gender: "female" },
    { studentCode: "HS005", fullName: "Do Quang Minh", gender: "male" },
  ].entries()) {
    const student = await Student.create({
      studentCode: payload.studentCode,
      fullName: payload.fullName,
      classId: classDoc._id,
      parentIds: [parent._id],
      dateOfBirth: new Date(2018, 0, index + 1),
      gender: payload.gender,
      address: "Demo address",
      status: "active",
    });

    students.push(student);
  }

  console.log("Seed completed");
  console.log(
    JSON.stringify(
      {
        teacher: {
          email: teacher.email,
          password: "Password123!",
        },
        parent: {
          email: parent.email,
          password: "Password123!",
        },
        admin: {
          email: admin.email,
          password: "Password123!",
        },
        class: {
          id: classDoc.id,
          className: classDoc.className,
        },
        students: students.map((student) => ({
          id: student.id,
          studentCode: student.studentCode,
        })),
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error("Seed failed", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
    });
}

module.exports = seed;
