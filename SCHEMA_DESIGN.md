# 📘 Student & Related Schema (Enhanced Design)

---

## 🧑‍🎓 Student Model

```ts
Student {
  id: String
  studentCode: String          // unique, indexed
  fullName: String
  dateOfBirth: Date
  gender: "male" | "female" | "other"

  classId: String              // indexed
  academicYear: String         // VD: "2025-2026"

  address: String
  avatar: String               // URL ảnh

  parentIds: String[]          // reference User

  status: "active" | "graduated" | "transferred"
  isActive: Boolean

  createdAt: Date
  updatedAt: Date
}
```

**Thay đổi:**
- ✅ Thêm `dateOfBirth`, `gender`
- ✅ Thêm `academicYear` để quản lý năm học
- ✅ Thêm `address`, `avatar`
- ✅ Thêm `status` (active/graduated/transferred)
- ❌ Xóa `className` (lấy từ Class model)
- ❌ Xóa `qrValue` (dùng `studentCode` trực tiếp)

---

## 🏫 Class Model

```ts
Class {
  id: String
  className: String            // VD: "10A1"
  grade: String                // VD: "10"
  academicYear: String         // VD: "2025-2026"

  teacherId: String            // reference User

  isActive: Boolean

  createdAt: Date
  updatedAt: Date
}
```

**Thay đổi:**
- ✅ Thêm `academicYear`
- ❌ Xóa `classId` (dùng `id` MongoDB)
- ❌ Xóa `studentIds[]` (query ngược từ Student)

---

## 📊 Attendance Model

```ts
Attendance {
  id: String

  studentId: String            // reference Student, indexed
  classId: String              // indexed

  date: Date                   // indexed
  status: "present" | "late" | "absent"

  checkInTime: Date

  teacherId: String            // reference User
  source: "QR" | "manual"

  notes: String

  createdAt: Date
  updatedAt: Date
}
```

**Thay đổi:**
- ✅ `date` từ String → Date
- ✅ `status` thêm "late"
- ✅ `source`: "qr_scan" → "QR"

**Index:**
- `{ studentId: 1, date: 1 }` unique
- `{ classId: 1, date: 1 }`

---

## 🔔 Notification Model

```ts
Notification {
  id: String

  userId: String               // reference User, indexed

  title: String
  message: String

  type: "attendance"
  refId: String                // attendanceId

  isRead: Boolean              // indexed

  createdAt: Date
  updatedAt: Date
}
```

**Thay đổi:**
- ✅ `recipientUserId` → `userId`
- ✅ Đơn giản hóa: xóa `studentId`, `payload`
- ✅ `type`: "attendance_checked_in" → "attendance"
- ✅ Thêm `refId` để link đến attendance

**Index:**
- `{ userId: 1, isRead: 1 }`

---

## 🔗 Quan hệ dữ liệu

- 1 **User (teacher)** → nhiều **Class**
- 1 **User (parent)** → nhiều **Student**
- 1 **Student** → thuộc 1 **Class** (via classId)
- 1 **Student** → nhiều **Attendance**
- 1 **Class** → nhiều **Attendance**
- 1 **User** → nhiều **Notification**

---

## 🔐 Enum chuẩn

```ts
// User
role: "teacher" | "parent" | "admin"

// Student
gender: "male" | "female" | "other"
status: "active" | "graduated" | "transferred"

// Attendance
status: "present" | "late" | "absent"
source: "QR" | "manual"

// Notification
type: "attendance"
```

---

## 🔳 QR Code Strategy

QR **KHÔNG lưu riêng trong DB**, encode trực tiếp:

```text
studentCode
```

Khi scan → gọi API:
```
GET /students/by-code/:studentCode
```

---

## ✅ Kết luận

Schema mới:
- ✔️ Đầy đủ thông tin học sinh (ngày sinh, giới tính, địa chỉ, ảnh)
- ✔️ Quản lý năm học (`academicYear`)
- ✔️ Trạng thái học sinh rõ ràng
- ✔️ Đơn giản hóa Notification
- ✔️ Tối ưu cho QR Attendance flow
- ✔️ Dễ mở rộng sau này

---

## 🚀 Cần làm tiếp

1. ✅ Cập nhật Mongoose models
2. ⏳ Cập nhật controllers (xử lý fields mới)
3. ⏳ Cập nhật seed data
4. ⏳ Cập nhật frontend types
5. ⏳ Thêm API `GET /students/by-code/:studentCode`
