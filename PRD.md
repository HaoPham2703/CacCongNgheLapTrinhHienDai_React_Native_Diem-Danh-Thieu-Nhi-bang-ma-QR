# PRD.md — Ứng dụng điểm danh học sinh bằng QR
**Tên sản phẩm đề xuất:** **ClassPulse Attendance**  
**Phiên bản:** v1.0  
**Ngày:** 2026-05-04  
**Tài liệu bởi:** Product Manager & Software Architect

---

## 1) Giới thiệu

### 1.1 Bối cảnh
Nhà trường cần số hóa quy trình điểm danh học sinh theo hướng nhanh, chính xác, giảm thao tác thủ công và tăng khả năng cập nhật thông tin tức thời cho phụ huynh.

### 1.2 Phạm vi sản phẩm (MVP)
Hệ thống mobile fullstack cho 2 vai trò:
- **Giáo viên:** quét QR để điểm danh và gửi thông báo.
- **Phụ huynh:** xem lịch sử điểm danh và thông báo của con.

### 1.3 Ngoài phạm vi (Out of scope cho MVP)
- Không tạo QR trong app (QR đã in sẵn trên nametag).
- Không triển khai push notification realtime phức tạp (FCM/APNs).
- Không có vai trò admin với web dashboard trong giai đoạn MVP.

---

## 2) Mục tiêu

### 2.1 Mục tiêu chính
Xây dựng ứng dụng điểm danh học sinh bằng QR code với một codebase React Native duy nhất, phân quyền theo role để phục vụ giáo viên và phụ huynh.

### 2.2 Mục tiêu đo lường (Success Metrics)
- **Tốc độ quét thành công:** < 2 giây/lần quét trong điều kiện mạng ổn định.
- **Tỷ lệ điểm danh thành công:** ≥ 99% (không lỗi ghi dữ liệu).
- **Độ trễ hiển thị lịch sử/notification:** < 1.5 giây cho truy vấn thông thường.
- **Tỷ lệ phụ huynh nhận thông tin điểm danh trong ngày:** ≥ 95%.

---

## 3) User Personas

### 3.1 Giáo viên (Teacher)
- **Mục tiêu:** điểm danh nhanh theo lớp, giảm sai sót, theo dõi danh sách đã điểm danh.
- **Nhu cầu chính:** quét QR ổn định, hiển thị thông tin học sinh rõ ràng, thao tác "Điểm danh" 1 chạm, xem lịch sử theo ngày/lớp.

### 3.2 Phụ huynh (Parent)
- **Mục tiêu:** biết con đã được điểm danh chưa, theo dõi lịch sử đi học.
- **Nhu cầu chính:** thông tin minh bạch, dễ xem theo ngày, thông báo rõ ràng.

---

## 4) Tính năng chi tiết

### 4.1 Xác thực & phân quyền
- Đăng nhập bằng tài khoản/mật khẩu.
- Hệ thống trả về `accessToken` JWT + thông tin role (`teacher` | `parent`).
- Đăng xuất: xóa token local + điều hướng về Login.
- Middleware backend kiểm tra token và role cho từng API.

**User stories**
- Là giáo viên, tôi muốn đăng nhập để vào màn hình điểm danh.
- Là phụ huynh, tôi muốn đăng nhập để xem thông tin của con.

---

### 4.2 Điểm danh bằng QR
- Ứng dụng dùng camera (Expo Camera + QR scanner).
- QR chứa `studentId` (chuỗi định danh duy nhất).
- Sau quét:
  1. Decode `studentId`
  2. Gọi API lấy thông tin học sinh
  3. Hiển thị màn hình kết quả (tên, lớp, mã số)
  4. Giáo viên bấm **"Điểm danh"** để lưu

- Dữ liệu lưu gồm: `studentId`, `classId`, `date`, `status`, `checkInTime`, `teacherId`.

**Business rules**
- Một học sinh chỉ có 1 bản ghi "có mặt" cho mỗi ngày học (có thể cập nhật nếu cần chỉnh sửa bởi giáo viên có quyền).
- Nếu quét QR không hợp lệ/không tồn tại học sinh → hiển thị lỗi rõ ràng, không tạo bản ghi.

---

### 4.3 Lịch sử điểm danh
- **Giáo viên:** lọc theo lớp/ngày, xem danh sách học sinh đã điểm danh/chưa điểm danh.
- **Phụ huynh:** xem theo con của mình, theo khoảng ngày.

Trường dữ liệu hiển thị:
- `studentId`
- `date`
- `status` (present/absent)
- `checkInTime`

---

### 4.4 Notification nội bộ ứng dụng
- Khi điểm danh thành công, hệ thống tạo notification cho phụ huynh tương ứng.
- Notification lưu MongoDB, phụ huynh mở app sẽ fetch danh sách.
- Hỗ trợ trạng thái `isRead` để đánh dấu đã đọc.

---

### 4.5 Quản lý QR học sinh
- Mỗi học sinh có QR cố định encode `studentId`.
- App chỉ đọc QR, không có UI tạo QR trong MVP.

---

## 5) User Flow

### 5.1 Flow giáo viên điểm danh
1. Giáo viên đăng nhập.
2. Vào **Teacher Dashboard** → mở **QR Scanner**.
3. Quét QR học sinh.
4. App hiển thị **Attendance Result** (tên, lớp, mã số).
5. Giáo viên bấm **Điểm danh**.
6. Backend lưu attendance.
7. Backend tạo notification cho phụ huynh.
8. App hiển thị xác nhận thành công.

### 5.2 Flow phụ huynh theo dõi
1. Phụ huynh đăng nhập.
2. Vào **Parent Dashboard**.
3. Xem **Attendance History** của con.
4. Mở **Notification** để xem thông báo mới/đã đọc.

---

## 6) Kiến trúc hệ thống

### 6.1 Tổng quan
- **Frontend:** React Native (Expo), 1 codebase, role-based navigation.
- **Backend:** Node.js + Express REST API, JWT auth.
- **Database:** MongoDB (Mongoose ODM đề xuất).

### 6.2 Kiến trúc logic
- App mobile gọi REST API qua HTTPS.
- API layer xử lý auth, validation, business rules.
- MongoDB lưu user/student/attendance/notification.
- Role-based access tại backend là nguồn xác thực cuối cùng.

### 6.3 Nguyên tắc bảo mật
- Hash mật khẩu bằng bcrypt.
- JWT hết hạn (ví dụ 24h) + refresh strategy (phase sau).
- Kiểm tra role trong middleware.
- Không trả dữ liệu vượt quyền (parent chỉ thấy dữ liệu con của mình).

---

## 7) Kiến trúc Frontend (React Native Expo)

> **Bắt buộc:** 1 app duy nhất, không tách FE_GiaoVien / FE_PhuHuynh.

### 7.1 Folder structure đề xuất
```text
src/
  navigation/
    AppNavigator.tsx
    AuthStack.tsx
    TeacherStack.tsx
    ParentStack.tsx
  screens/
    auth/
      LoginScreen.tsx
    teacher/
      TeacherDashboardScreen.tsx
      QRScannerScreen.tsx
      AttendanceResultScreen.tsx
      TeacherAttendanceHistoryScreen.tsx
    parent/
      ParentDashboardScreen.tsx
      ParentAttendanceHistoryScreen.tsx
      NotificationScreen.tsx
  components/
    common/
      Button.tsx
      Loading.tsx
      EmptyState.tsx
    attendance/
      AttendanceCard.tsx
  services/
    apiClient.ts
    authService.ts
    studentService.ts
    attendanceService.ts
    notificationService.ts
  store/
    authStore.ts
    appStore.ts
  utils/
    date.ts
    qr.ts
  constants/
    roles.ts
    routes.ts
    api.ts
```

### 7.2 Role-based navigation
- `AppNavigator` đọc trạng thái đăng nhập + role từ store.
- Nếu chưa đăng nhập → `AuthStack`.
- Nếu role = `teacher` → `TeacherStack`.
- Nếu role = `parent` → `ParentStack`.

**Routing sau login**
- Teacher: `Login` → `TeacherDashboard`
- Parent: `Login` → `ParentDashboard`

### 7.3 State management
- Đề xuất **Zustand** (nhẹ, đơn giản) hoặc Context API.
- Store tối thiểu:
  - `auth`: token, user info, role, login/logout
  - `notifications`: danh sách + unread count
  - `attendance filter state`: ngày/lớp

---

## 8) Schema Database (MongoDB)

### 8.1 Collection: `users`
```json
{
  "_id": "ObjectId",
  "fullName": "String",
  "email": "String (unique, indexed)",
  "phone": "String",
  "passwordHash": "String",
  "role": "String enum: ['teacher', 'parent']",
  "isActive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 8.2 Collection: `students`
```json
{
  "_id": "ObjectId",
  "studentCode": "String (unique, indexed)",
  "fullName": "String",
  "classId": "String (indexed)",
  "className": "String",
  "parentIds": ["ObjectId -> users._id (role=parent)"],
  "qrValue": "String (encode studentId, unique)",
  "isActive": "Boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 8.3 Collection: `attendance`
```json
{
  "_id": "ObjectId",
  "studentId": "ObjectId -> students._id (indexed)",
  "classId": "String (indexed)",
  "date": "String YYYY-MM-DD (indexed)",
  "status": "String enum: ['present', 'absent']",
  "checkInTime": "Date",
  "teacherId": "ObjectId -> users._id (role=teacher)",
  "source": "String enum: ['qr_scan', 'manual'] default 'qr_scan'",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

**Index quan trọng**
- Compound unique: `{ studentId: 1, date: 1 }` để tránh điểm danh trùng/ngày.
- Query index: `{ classId: 1, date: 1 }` cho giáo viên lọc theo lớp/ngày.

### 8.4 Collection: `notifications`
```json
{
  "_id": "ObjectId",
  "recipientUserId": "ObjectId -> users._id (role=parent, indexed)",
  "studentId": "ObjectId -> students._id",
  "type": "String enum: ['attendance_checked_in']",
  "title": "String",
  "message": "String",
  "payload": {
    "attendanceId": "ObjectId",
    "date": "String YYYY-MM-DD",
    "checkInTime": "Date"
  },
  "isRead": "Boolean default false (indexed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## 9) Thiết kế API (REST + JWT)

Base URL: `/api/v1`

### 9.1 Auth
- `POST /auth/login`
  - Req: `{ email, password }`
  - Res: `{ accessToken, user: { id, fullName, role } }`
- `POST /auth/logout` (optional server-side blacklist phase sau)

### 9.2 Student
- `GET /students/:id` (teacher)
  - Dùng sau khi decode QR.
- `GET /students/me/children` (parent)
  - Trả danh sách con của phụ huynh đăng nhập.

### 9.3 Attendance
- `POST /attendance/check-in` (teacher)
  - Req: `{ studentId, status='present' }`
  - Res: attendance record
  - Side effect: tạo notification cho parent.
- `GET /attendance/teacher`
  - Query: `classId`, `date`
  - Role: teacher
- `GET /attendance/parent`
  - Query: `studentId`, `fromDate`, `toDate`
  - Role: parent (chỉ student thuộc parent đó)

### 9.4 Notification
- `GET /notifications` (parent)
  - Query: `page`, `limit`, `isRead`
- `PATCH /notifications/:id/read` (parent)
- `PATCH /notifications/read-all` (parent)

### 9.5 HTTP & lỗi chuẩn
- `200/201`: thành công
- `400`: dữ liệu đầu vào sai
- `401`: chưa xác thực
- `403`: sai quyền
- `404`: không tìm thấy học sinh/bản ghi
- `409`: conflict (điểm danh trùng ngày)
- `500`: lỗi hệ thống

---

## 10) Mô tả UI Screens

### 10.1 Login Screen
- Input email/password.
- Nút đăng nhập.
- Hiển thị lỗi xác thực.
- Thành công → route theo role.

### 10.2 Teacher Dashboard
- Shortcut: Quét QR, Lịch sử điểm danh.
- Bộ lọc nhanh theo lớp/ngày.

### 10.3 QR Scanner Screen
- Camera preview + vùng scan.
- Trạng thái scanning/loading.
- Xử lý quyền camera chưa cấp.

### 10.4 Attendance Result Screen
- Hiển thị: tên học sinh, lớp, mã số.
- Nút **Điểm danh**.
- Feedback thành công/thất bại rõ ràng.

### 10.5 Parent Dashboard
- Tổng quan điểm danh gần nhất của con.
- Điều hướng tới lịch sử và thông báo.

### 10.6 Attendance History Screen
- Danh sách bản ghi theo ngày.
- Filter theo khoảng thời gian.
- Badge trạng thái `Có mặt` / `Vắng`.

### 10.7 Notification Screen
- Danh sách thông báo theo thời gian.
- Đánh dấu đã đọc / đọc tất cả.
- Truy cập nhanh bản ghi điểm danh liên quan.

---

## 11) Yêu cầu phi chức năng

- **Hiệu năng:** thao tác quét và lưu phải nhanh, ổn định.
- **Độ sẵn sàng:** app xử lý tốt lỗi mạng tạm thời (retry nhẹ ở client).
- **Khả năng mở rộng:** dễ thêm role admin, push notification, báo cáo.
- **Bảo mật:** JWT, hash password, phân quyền nghiêm ngặt, không lộ dữ liệu chéo.
- **UX:** thao tác tối giản, dễ dùng cho người không rành công nghệ.

---

## 12) Hướng phát triển tương lai

1. Push notification realtime (FCM/APNs).
2. Dashboard admin web cho nhà trường.
3. Báo cáo thống kê chuyên sâu theo tuần/tháng/học kỳ.
4. Offline-first queue cho điểm danh khi mất mạng.
5. Đồng bộ SIS/ERP của trường qua API tích hợp.
6. Phân quyền chi tiết hơn (homeroom teacher, supervisor).
7. Audit log đầy đủ cho compliance.

---

## 13) Tiêu chí nghiệm thu MVP (Acceptance Criteria)

- Đăng nhập thành công và route đúng theo role.
- Giáo viên quét QR, thấy đúng học sinh, bấm điểm danh lưu thành công.
- Attendance không bị trùng cho cùng `studentId + date`.
- Notification được tạo sau điểm danh và phụ huynh xem được trong app.
- Giáo viên lọc lịch sử theo lớp/ngày hoạt động đúng.
- Phụ huynh chỉ xem được dữ liệu của con mình.
- Toàn bộ chạy trên một codebase React Native Expo duy nhất.
