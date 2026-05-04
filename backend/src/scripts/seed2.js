const { loadEnv, getRequiredEnv } = require("../config/env");
const connectDatabase = require("../config/database");
const { Attendance } = require("../models/Attendance");
const ClassModel = require("../models/Class");
const { Notification } = require("../models/Notification");
const { User } = require("../models/User");
const Student = require("../models/Student");

loadEnv();

const COMMON_PASSWORD = "Password123!";

const userSeeds = {
  teachers: [
    {
      fullName: "Nguyễn Minh Khôi",
      email: "giaovien1@classpulse.local",
      phone: "0901000001",
      role: "teacher",
    },
    {
      fullName: "Trần Thị Thu Hà",
      email: "giaovien2@classpulse.local",
      phone: "0901000002",
      role: "teacher",
    },
    {
      fullName: "Lê Quốc Bảo",
      email: "giaovien3@classpulse.local",
      phone: "0901000003",
      role: "teacher",
    },
  ],
  parents: [
    {
      fullName: "Phạm Ngọc Lan",
      email: "phuhuynh1@classpulse.local",
      phone: "0902000001",
      role: "parent",
    },
    {
      fullName: "Đỗ Hoàng Vũ",
      email: "phuhuynh2@classpulse.local",
      phone: "0902000002",
      role: "parent",
    },
    {
      fullName: "Bùi Thanh Mai",
      email: "phuhuynh3@classpulse.local",
      phone: "0902000003",
      role: "parent",
    },
    {
      fullName: "Võ Đức Tâm",
      email: "phuhuynh4@classpulse.local",
      phone: "0902000004",
      role: "parent",
    },
  ],
  admins: [
    {
      fullName: "Quản trị viên hệ thống",
      email: "admin@classpulse.local",
      phone: "0903000001",
      role: "admin",
    },
  ],
};

const classSeeds = [
  {
    className: "Lớp 1A",
    grade: "1",
    academicYear: "2026-2027",
    teacherEmail: "giaovien1@classpulse.local",
    isActive: true,
  },
  {
    className: "Lớp 2B",
    grade: "2",
    academicYear: "2026-2027",
    teacherEmail: "giaovien2@classpulse.local",
    isActive: true,
  },
  {
    className: "Lớp 3C",
    grade: "3",
    academicYear: "2026-2027",
    teacherEmail: "giaovien3@classpulse.local",
    isActive: false,
  },
];

const studentSeeds = [
  {
    studentCode: "HS1001",
    fullName: "Nguyễn Gia Hân",
    className: "Lớp 1A",
    parentEmails: ["phuhuynh1@classpulse.local"],
    dateOfBirth: new Date("2018-01-12T00:00:00.000Z"),
    gender: "female",
    address: "12 Nguyễn Du, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=32",
    status: "active",
    isActive: true,
  },
  {
    studentCode: "HS1002",
    fullName: "Trần Nhật Minh",
    className: "Lớp 1A",
    parentEmails: ["phuhuynh2@classpulse.local"],
    dateOfBirth: new Date("2018-03-25T00:00:00.000Z"),
    gender: "male",
    address: "45 Lê Lợi, Phường 4, Quận Gò Vấp, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=12",
    status: "active",
    isActive: true,
  },
  {
    studentCode: "HS1003",
    fullName: "Phạm Khánh Vy",
    className: "Lớp 1A",
    parentEmails: ["phuhuynh1@classpulse.local", "phuhuynh3@classpulse.local"],
    dateOfBirth: new Date("2018-06-03T00:00:00.000Z"),
    gender: "female",
    address: "88 Trường Sa, Phường 14, Quận 3, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=47",
    status: "active",
    isActive: true,
  },
  {
    studentCode: "HS2001",
    fullName: "Lê Hoàng Nam",
    className: "Lớp 2B",
    parentEmails: ["phuhuynh4@classpulse.local"],
    dateOfBirth: new Date("2017-02-15T00:00:00.000Z"),
    gender: "male",
    address: "101 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=15",
    status: "active",
    isActive: true,
  },
  {
    studentCode: "HS2002",
    fullName: "Bùi Thiên An",
    className: "Lớp 2B",
    parentEmails: ["phuhuynh3@classpulse.local"],
    dateOfBirth: new Date("2017-07-21T00:00:00.000Z"),
    gender: "other",
    address: "22 Võ Văn Tần, Phường Xuân Hòa, Quận 3, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=5",
    status: "transferred",
    isActive: false,
  },
  {
    studentCode: "HS2003",
    fullName: "Đặng Tuệ Lâm",
    className: "Lớp 2B",
    parentEmails: ["phuhuynh2@classpulse.local"],
    dateOfBirth: new Date("2017-11-09T00:00:00.000Z"),
    gender: "female",
    address: "64 Âu Cơ, Phường 10, Quận Tân Bình, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=41",
    status: "active",
    isActive: true,
  },
  {
    studentCode: "HS3001",
    fullName: "Võ Anh Khoa",
    className: "Lớp 3C",
    parentEmails: ["phuhuynh4@classpulse.local"],
    dateOfBirth: new Date("2016-04-18T00:00:00.000Z"),
    gender: "male",
    address: "9 Nguyễn Oanh, Phường 7, Quận Gò Vấp, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=20",
    status: "graduated",
    isActive: false,
  },
  {
    studentCode: "HS3002",
    fullName: "Hồ Ngọc Diệp",
    className: "Lớp 3C",
    parentEmails: ["phuhuynh1@classpulse.local"],
    dateOfBirth: new Date("2016-09-02T00:00:00.000Z"),
    gender: "female",
    address: "17 Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    avatar: "https://i.pravatar.cc/300?img=24",
    status: "active",
    isActive: true,
  },
];

const attendanceSeeds = [
  {
    studentCode: "HS1001",
    date: "2026-05-02",
    status: "present",
    checkInTime: "2026-05-02T06:55:00.000Z",
    source: "QR",
    notes: "Đi học đúng giờ, đồng phục đầy đủ.",
  },
  {
    studentCode: "HS1002",
    date: "2026-05-02",
    status: "late",
    checkInTime: "2026-05-02T07:18:00.000Z",
    source: "manual",
    notes: "Đến muộn do kẹt xe.",
  },
  {
    studentCode: "HS1003",
    date: "2026-05-02",
    status: "present",
    checkInTime: "2026-05-02T06:57:00.000Z",
    source: "QR",
    notes: "Tinh thần tốt.",
  },
  {
    studentCode: "HS2001",
    date: "2026-05-02",
    status: "absent",
    checkInTime: "2026-05-02T07:30:00.000Z",
    source: "manual",
    notes: "Nghỉ ốm có báo phụ huynh.",
  },
  {
    studentCode: "HS2003",
    date: "2026-05-02",
    status: "present",
    checkInTime: "2026-05-02T06:50:00.000Z",
    source: "QR",
    notes: "Có tham gia trực nhật đầu giờ.",
  },
];

async function createUsers(items) {
  return Promise.all(
    items.map((item) =>
      User.create({
        ...item,
        passwordHash: COMMON_PASSWORD,
      }),
    ),
  );
}

async function seed() {
  await connectDatabase(getRequiredEnv("MONGODB_URI"));
  await Notification.db.dropDatabase();

  const teachers = await createUsers(userSeeds.teachers);
  const parents = await createUsers(userSeeds.parents);
  const admins = await createUsers(userSeeds.admins);
  const usersByEmail = new Map([...teachers, ...parents, ...admins].map((user) => [user.email, user]));

  const classes = await Promise.all(
    classSeeds.map((item) =>
      ClassModel.create({
        className: item.className,
        grade: item.grade,
        academicYear: item.academicYear,
        teacherId: usersByEmail.get(item.teacherEmail)._id,
        isActive: item.isActive,
      }),
    ),
  );
  const classesByName = new Map(classes.map((classDoc) => [classDoc.className, classDoc]));

  const students = await Promise.all(
    studentSeeds.map((item) =>
      Student.create({
        studentCode: item.studentCode,
        fullName: item.fullName,
        classId: classesByName.get(item.className)._id,
        parentIds: item.parentEmails.map((email) => usersByEmail.get(email)._id),
        dateOfBirth: item.dateOfBirth,
        gender: item.gender,
        address: item.address,
        avatar: item.avatar,
        status: item.status,
        isActive: item.isActive,
      }),
    ),
  );
  const studentsByCode = new Map(students.map((student) => [student.studentCode, student]));

  const attendanceRecords = await Promise.all(
    attendanceSeeds.map((item) => {
      const student = studentsByCode.get(item.studentCode);
      const classDoc = classes.find((entry) => entry._id.equals(student.classId));

      return Attendance.create({
        studentId: student._id,
        classId: classDoc._id,
        academicYear: classDoc.academicYear,
        date: new Date(`${item.date}T00:00:00.000Z`),
        status: item.status,
        checkInTime: new Date(item.checkInTime),
        teacherId: classDoc.teacherId,
        source: item.source,
        notes: item.notes,
      });
    }),
  );

  await Promise.all(
    attendanceRecords.map((attendance, index) => {
      const student = students.find((item) => item._id.equals(attendance.studentId));

      return Promise.all(
        student.parentIds.map((parentId) =>
          Notification.create({
            userId: parentId,
            title: "Cập nhật điểm danh",
            message: `${student.fullName} có trạng thái điểm danh: ${attendance.status}.`,
            type: "attendance",
            refId: attendance._id,
            createdBy: attendance.teacherId,
            isRead: index % 2 === 0,
          }),
        ),
      );
    }),
  );

  console.log("Seed2 completed");
  console.log(
    JSON.stringify(
      {
        password: COMMON_PASSWORD,
        admins: admins.map((user) => ({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        })),
        teachers: teachers.map((user) => ({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        })),
        parents: parents.map((user) => ({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        })),
        classes: classes.map((classDoc) => ({
          className: classDoc.className,
          grade: classDoc.grade,
          academicYear: classDoc.academicYear,
          isActive: classDoc.isActive,
        })),
        students: students.map((student) => ({
          studentCode: student.studentCode,
          fullName: student.fullName,
          address: student.address,
          status: student.status,
          isActive: student.isActive,
        })),
        attendanceCount: attendanceRecords.length,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error("Seed2 failed", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      const mongoose = require("mongoose");
      await mongoose.disconnect();
    });
}

module.exports = seed;
