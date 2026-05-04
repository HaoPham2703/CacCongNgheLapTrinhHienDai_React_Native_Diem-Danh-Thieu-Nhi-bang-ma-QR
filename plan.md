# Implementation Plan — ClassPulse Attendance

**Dự án:** Ứng dụng điểm danh học sinh bằng QR code  
**Tech Stack:** React Native Expo + Node.js Express + MongoDB  
**Timeline ước tính:** 7–10 ngày làm việc  
**Ngày tạo:** 2026-05-04

---

## 1. Tổng quan kế hoạch

### Mô tả dự án
Xây dựng ứng dụng mobile fullstack cho phép:
- **Giáo viên:** quét QR code để điểm danh học sinh, xem lịch sử điểm danh theo lớp/ngày
- **Phụ huynh:** xem lịch sử điểm danh và thông báo của con

### Phạm vi (Scope)
- ✅ Đăng nhập JWT với phân quyền role-based (teacher/parent)
- ✅ Quét QR code để điểm danh (camera + decode studentId)
- ✅ CRUD attendance records với business rules (1 học sinh/ngày)
- ✅ Tự động tạo notification cho phụ huynh sau điểm danh
- ✅ Lọc lịch sử theo lớp, ngày, học sinh
- ✅ UI/UX tối giản, dễ sử dụng
- ❌ Không tạo QR trong app (QR đã in sẵn)
- ❌ Không push notification realtime (FCM/APNs)
- ❌ Không có admin web dashboard trong MVP

### Các module chính
1. **Authentication & Authorization** (JWT, role-based routing)
2. **Student Management** (CRUD, search, filter)
3. **Attendance System** (QR scan, check-in, history)
4. **Notification System** (auto-create, read/unread)
5. **Class Management** (danh sách lớp, filter)

---

## 2. Phân chia giai đoạn (Milestones)

### Phase 1: Setup & Architecture (1 ngày)
- Setup backend project (Express + MongoDB)
- Setup frontend project (Expo + React Navigation)
- Thiết kế database schema
- Cấu hình môi trường dev

### Phase 2: Backend Development (2.5 ngày)
- Authentication & JWT middleware
- Student API
- Class API
- Attendance API
- Notification API
- Seed data cho testing

### Phase 3: Frontend Development (2.5 ngày)
- Navigation & role-based routing
- Login screen
- Teacher screens (QR scan, attendance list, history)
- Parent screens (child info, history, notifications)
- Shared components

### Phase 4: Integration (1.5 ngày)
- Kết nối frontend với backend APIs
- Error handling & validation
- Loading states & UX polish

### Phase 5: Testing & Polish (1.5 ngày)
- Test từng API endpoint
- Test user flows (teacher & parent)
- Fix bugs & edge cases
- Performance optimization

---

## 3. Task Breakdown

### 📦 Phase 1: Setup & Architecture

#### Backend Setup
- [ ] **BE-1.1:** Khởi tạo Node.js project với Express
  - `npm init`, cài đặt dependencies: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`
  - Tạo cấu trúc thư mục: `src/models`, `src/routes`, `src/controllers`, `src/middleware`, `src/config`
  - **Thời gian:** 0.5 ngày

- [ ] **BE-1.2:** Kết nối MongoDB
  - Setup MongoDB Atlas hoặc local MongoDB
  - Tạo `src/config/database.js` với connection string
  - Test connection thành công
  - **Thời gian:** 0.25 ngày

- [ ] **BE-1.3:** Thiết kế database schema
  - `User` schema: `{ username, password, role, fullName, email, phone, linkedStudents[] }`
  - `Student` schema: `{ studentId, fullName, classId, dateOfBirth, parentId, qrCode, status }`
  - `Class` schema: `{ classId, className, grade, teacherId, students[] }`
  - `Attendance` schema: `{ studentId, classId, date, status, checkInTime, teacherId, notes }`
  - `Notification` schema: `{ userId, studentId, type, title, message, isRead, createdAt, relatedAttendanceId }`
  - **Thời gian:** 0.25 ngày

#### Frontend Setup
- [ ] **FE-1.1:** Khởi tạo Expo project
  - `npx create-expo-app ClassPulseAttendance`
  - Cài đặt dependencies: `@react-navigation/native`, `@react-navigation/stack`, `expo-camera`, `expo-barcode-scanner`, `axios`, `@react-native-async-storage/async-storage`
  - **Thời gian:** 0.25 ngày

- [ ] **FE-1.2:** Setup React Navigation với role-based routing
  - Tạo `AuthStack` (Login)
  - Tạo `TeacherStack` (QR Scanner, Attendance List, History)
  - Tạo `ParentStack` (Child Info, History, Notifications)
  - Tạo `RootNavigator` với logic phân quyền
  - **Thời gian:** 0.5 ngày

- [ ] **FE-1.3:** Setup API client & auth context
  - Tạo `src/services/api.js` với axios instance
  - Tạo `src/context/AuthContext.js` để quản lý token & user info
  - Implement AsyncStorage cho persist token
  - **Thời gian:** 0.25 ngày

---

### 🔧 Phase 2: Backend Development

#### Authentication
- [ ] **BE-2.1:** Implement User model & password hashing
  - Tạo `src/models/User.js` với bcrypt pre-save hook
  - Method `comparePassword()` để verify
  - **Thời gian:** 0.25 ngày

- [ ] **BE-2.2:** Auth routes & JWT
  - `POST /api/auth/login` → trả về `{ accessToken, user: { id, username, role, fullName } }`
  - `POST /api/auth/logout` (optional, client-side clear token)
  - Tạo `src/middleware/auth.js` để verify JWT
  - Tạo `src/middleware/roleCheck.js` để check role
  - **Thời gian:** 0.5 ngày

#### Student API
- [ ] **BE-2.3:** Student CRUD
  - `GET /api/students` (teacher only, filter by classId)
  - `GET /api/students/:id` (teacher + parent nếu là con mình)
  - `POST /api/students` (teacher only)
  - `PUT /api/students/:id` (teacher only)
  - `DELETE /api/students/:id` (teacher only)
  - **Thời gian:** 0.5 ngày

#### Class API
- [ ] **BE-2.4:** Class CRUD
  - `GET /api/classes` (teacher: all, parent: classes của con)
  - `GET /api/classes/:id` (teacher + parent nếu con học lớp đó)
  - `POST /api/classes` (teacher only)
  - `PUT /api/classes/:id` (teacher only)
  - **Thời gian:** 0.25 ngày

#### Attendance API
- [ ] **BE-2.5:** Attendance endpoints
  - `POST /api/attendance/check-in` (teacher only)
    - Input: `{ studentId, classId, status, notes }`
    - Business rule: check duplicate (studentId + date), nếu có thì update
    - Tự động tạo notification cho parent
  - `GET /api/attendance` (teacher: filter by classId/date, parent: filter by studentId của con)
  - `GET /api/attendance/:id` (teacher + parent nếu là con mình)
  - `PUT /api/attendance/:id` (teacher only, update status/notes)
  - `DELETE /api/attendance/:id` (teacher only)
  - **Thời gian:** 0.75 ngày

#### Notification API
- [ ] **BE-2.6:** Notification endpoints
  - `GET /api/notifications` (parent: chỉ của mình, teacher: của lớp mình dạy)
  - `PUT /api/notifications/:id/read` (mark as read)
  - `PUT /api/notifications/read-all` (mark all as read)
  - **Thời gian:** 0.25 ngày

#### Seed Data
- [ ] **BE-2.7:** Tạo seed script
  - Tạo `src/scripts/seed.js`
  - Seed 2 users: 1 teacher, 1 parent
  - Seed 1 class với 5 students
  - Link parent với 1 student
  - **Thời gian:** 0.25 ngày

---

### 📱 Phase 3: Frontend Development

#### Shared Components
- [ ] **FE-3.1:** Tạo shared components
  - `Button.js` (primary, secondary, danger)
  - `Input.js` (text, password)
  - `Card.js` (container cho list items)
  - `LoadingSpinner.js`
  - `ErrorMessage.js`
  - **Thời gian:** 0.25 ngày

#### Login Screen
- [ ] **FE-3.2:** Login screen
  - Form với username + password
  - Call `POST /api/auth/login`
  - Lưu token vào AsyncStorage
  - Navigate theo role (teacher → TeacherStack, parent → ParentStack)
  - Error handling (sai mật khẩu, network error)
  - **Thời gian:** 0.5 ngày

#### Teacher Screens
- [ ] **FE-3.3:** QR Scanner Screen
  - Request camera permission
  - Sử dụng `expo-barcode-scanner` để quét QR
  - Decode `studentId` từ QR
  - Call `GET /api/students/:id` để lấy thông tin
  - Hiển thị modal xác nhận (tên, lớp, ảnh)
  - Button "Điểm danh" → call `POST /api/attendance/check-in`
  - Success feedback → quay lại scanner
  - **Thời gian:** 0.75 ngày

- [ ] **FE-3.4:** Attendance List Screen (Teacher)
  - Hiển thị danh sách attendance hôm nay
  - Filter by class (dropdown)
  - Hiển thị: tên học sinh, lớp, giờ điểm danh, status
  - Pull-to-refresh
  - **Thời gian:** 0.5 ngày

- [ ] **FE-3.5:** History Screen (Teacher)
  - Filter by date (date picker) + class
  - Hiển thị list attendance records
  - Tap vào item → xem chi tiết + edit (status, notes)
  - **Thời gian:** 0.5 ngày

#### Parent Screens
- [ ] **FE-3.6:** Child Info Screen (Parent)
  - Hiển thị thông tin con: tên, lớp, mã số
  - Hiển thị attendance summary (số ngày đi học trong tháng)
  - **Thời gian:** 0.25 ngày

- [ ] **FE-3.7:** History Screen (Parent)
  - Hiển thị lịch sử điểm danh của con
  - Filter by date range
  - Hiển thị: ngày, giờ, status, notes
  - **Thời gian:** 0.5 ngày

- [ ] **FE-3.8:** Notification Screen (Parent)
  - Hiển thị danh sách notifications (mới nhất trên cùng)
  - Badge cho unread count
  - Tap vào notification → mark as read + navigate to related attendance
  - Button "Đánh dấu tất cả đã đọc"
  - **Thời gian:** 0.5 ngày

---

### 🔗 Phase 4: Integration

- [ ] **INT-4.1:** Kết nối Login với backend
  - Test login thành công với teacher account
  - Test login thành công với parent account
  - Test login thất bại (sai password)
  - Verify token được lưu và auto-login
  - **Thời gian:** 0.25 ngày

- [ ] **INT-4.2:** Kết nối QR Scanner với backend
  - Test quét QR hợp lệ → hiển thị đúng thông tin học sinh
  - Test quét QR không hợp lệ → hiển thị error
  - Test điểm danh thành công → tạo attendance record
  - Test điểm danh trùng (cùng ngày) → update record cũ
  - **Thời gian:** 0.5 ngày

- [ ] **INT-4.3:** Kết nối Attendance List & History
  - Test filter by class hoạt động đúng
  - Test filter by date hoạt động đúng
  - Test edit attendance (teacher) thành công
  - **Thời gian:** 0.25 ngày

- [ ] **INT-4.4:** Kết nối Parent screens
  - Test parent chỉ xem được data của con mình
  - Test notification được tạo sau khi teacher điểm danh
  - Test mark as read hoạt động đúng
  - **Thời gian:** 0.25 ngày

- [ ] **INT-4.5:** Error handling & UX polish
  - Implement global error handler
  - Loading states cho tất cả API calls
  - Empty states (không có data)
  - Network error retry logic
  - Form validation (client-side)
  - **Thời gian:** 0.25 ngày

---

### ✅ Phase 5: Testing & Polish

- [ ] **TEST-5.1:** Backend API testing
  - Test tất cả endpoints với Postman/Thunder Client
  - Test authentication middleware
  - Test role-based authorization
  - Test business rules (duplicate attendance, parent chỉ xem con mình)
  - **Thời gian:** 0.5 ngày

- [ ] **TEST-5.2:** Frontend flow testing
  - Test teacher flow: login → scan QR → điểm danh → xem history
  - Test parent flow: login → xem history → xem notification
  - Test logout → login lại
  - Test edge cases (mất mạng, QR lỗi, empty data)
  - **Thời gian:** 0.5 ngày

- [ ] **TEST-5.3:** Bug fixes & optimization
  - Fix bugs phát hiện trong testing
  - Optimize API queries (add indexes)
  - Optimize UI performance (memoization, lazy loading)
  - **Thời gian:** 0.5 ngày

---

## 4. Thứ tự ưu tiên & Dependencies

### Critical Path (phải làm theo thứ tự)
1. **BE-1.1 → BE-1.2 → BE-1.3** (setup backend trước)
2. **BE-2.1 → BE-2.2** (auth trước khi làm các API khác)
3. **BE-2.3 → BE-2.5** (student API trước attendance API vì attendance phụ thuộc student)
4. **FE-1.1 → FE-1.2 → FE-1.3** (setup frontend trước)
5. **FE-3.2** (login screen trước các screen khác)
6. **BE-2.7** (seed data trước khi test integration)

### Có thể làm song song
- **BE-2.3, BE-2.4** (Student & Class API độc lập)
- **FE-3.1** (shared components) có thể làm song song với backend
- **FE-3.3, FE-3.4, FE-3.5** (teacher screens) sau khi có navigation
- **FE-3.6, FE-3.7, FE-3.8** (parent screens) sau khi có navigation

### Priority Levels
- **P0 (Must Have):** BE-2.1, BE-2.2, BE-2.3, BE-2.5, FE-3.2, FE-3.3, FE-3.7
- **P1 (Should Have):** BE-2.4, BE-2.6, FE-3.4, FE-3.5, FE-3.8
- **P2 (Nice to Have):** FE-3.6, INT-4.5 (advanced error handling)

---

## 5. Timeline đề xuất

| Phase | Tasks | Thời gian | Ngày bắt đầu | Ngày kết thúc |
|-------|-------|-----------|--------------|---------------|
| Phase 1 | BE-1.1 → FE-1.3 | 1 ngày | Ngày 1 | Ngày 1 |
| Phase 2 | BE-2.1 → BE-2.7 | 2.5 ngày | Ngày 2 | Ngày 4 (sáng) |
| Phase 3 | FE-3.1 → FE-3.8 | 2.5 ngày | Ngày 4 (chiều) | Ngày 6 |
| Phase 4 | INT-4.1 → INT-4.5 | 1.5 ngày | Ngày 7 | Ngày 8 (sáng) |
| Phase 5 | TEST-5.1 → TEST-5.3 | 1.5 ngày | Ngày 8 (chiều) | Ngày 9 |

**Tổng thời gian:** 9 ngày làm việc (có thể rút xuống 7 ngày nếu làm song song)

---

## 6. Definition of Done

### Backend Task DoD
- [ ] Code được commit với message rõ ràng
- [ ] API endpoint hoạt động đúng (test bằng Postman)
- [ ] Có error handling (try-catch, status codes đúng)
- [ ] Có validation input (check required fields)
- [ ] Middleware auth/role hoạt động đúng
- [ ] Không có console.log thừa

### Frontend Task DoD
- [ ] UI hiển thị đúng trên iOS & Android (test bằng Expo Go)
- [ ] Loading state khi call API
- [ ] Error message hiển thị rõ ràng
- [ ] Navigation hoạt động đúng
- [ ] Không có warning trong console
- [ ] Code clean, có comments cho logic phức tạp

### Integration Task DoD
- [ ] Frontend call đúng API endpoint
- [ ] Data hiển thị đúng trên UI
- [ ] Error từ backend được handle đúng
- [ ] User flow hoàn chỉnh (từ đầu đến cuối)

### Testing Task DoD
- [ ] Tất cả test cases pass
- [ ] Không có bug critical
- [ ] Performance chấp nhận được (< 2s cho QR scan)
- [ ] App không crash trong điều kiện bình thường

---

## 7. Rủi ro & Cách xử lý

### 🔴 Rủi ro cao

#### R1: QR Scanner không hoạt động trên thiết bị thật
**Nguyên nhân:** Camera permission bị từ chối, QR format không đúng  
**Cách xử lý:**
- Request permission rõ ràng với message giải thích
- Test trên nhiều thiết bị (iOS & Android)
- Fallback: cho phép nhập `studentId` thủ công nếu camera lỗi
- Validate QR format trước khi decode

#### R2: Attendance bị trùng lặp (duplicate check-in)
**Nguyên nhân:** Logic check duplicate không đúng, race condition  
**Cách xử lý:**
- Tạo unique index trên MongoDB: `{ studentId, date }`
- Backend check trước khi insert, nếu tồn tại thì update
- Frontend hiển thị warning nếu học sinh đã được điểm danh

#### R3: Parent xem được data của học sinh khác
**Nguyên nhân:** Authorization logic lỗi  
**Cách xử lý:**
- Middleware `roleCheck` kiểm tra `linkedStudents` của parent
- Backend filter data theo `parentId` trước khi trả về
- Test kỹ authorization với nhiều parent accounts

### 🟡 Rủi ro trung bình

#### R4: API response chậm (> 2s)
**Nguyên nhân:** Query không tối ưu, thiếu index  
**Cách xử lý:**
- Thêm index cho các field thường query: `studentId`, `classId`, `date`, `userId`
- Pagination cho list API (limit 50 records/page)
- Cache data ở client (AsyncStorage) cho offline viewing

#### R5: Token hết hạn giữa chừng
**Nguyên nhân:** JWT expiry time quá ngắn  
**Cách xử lý:**
- Set expiry time hợp lý (7 ngày)
- Implement refresh token (nếu cần)
- Auto logout + redirect to login khi token invalid

### 🟢 Rủi ro thấp

#### R6: UI không responsive trên màn hình nhỏ
**Cách xử lý:**
- Test trên nhiều kích thước màn hình
- Dùng Flexbox, ScrollView cho layout linh hoạt

#### R7: Notification không được tạo sau điểm danh
**Cách xử lý:**
- Log rõ ràng khi tạo notification
- Test flow: điểm danh → check DB có notification → parent xem được

---

## 8. Công cụ đề xuất

### Backend Development
- **IDE:** VS Code với extensions: ESLint, Prettier, MongoDB for VS Code
- **API Testing:** Postman hoặc Thunder Client (VS Code extension)
- **Database:** MongoDB Compass (GUI để xem data)
- **Version Control:** Git + GitHub/GitLab

### Frontend Development
- **IDE:** VS Code với extensions: React Native Tools, ESLint, Prettier
- **Testing:** Expo Go app (iOS & Android)
- **Debugging:** React Native Debugger hoặc Chrome DevTools

### Project Management
- **Task Tracking:** Trello, Notion, hoặc GitHub Projects
- **Documentation:** Markdown files trong repo

### Environment Variables
**Backend (.env):**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/classpulse
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d
```

**Frontend (.env):**
```
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 9. Checklist tổng thể

### Pre-Development
- [ ] Đọc kỹ PRD
- [ ] Setup môi trường dev (Node.js, MongoDB, Expo CLI)
- [ ] Tạo repo Git
- [ ] Tạo branch `develop` từ `main`

### During Development
- [ ] Commit thường xuyên với message rõ ràng
- [ ] Test từng feature sau khi hoàn thành
- [ ] Update plan.md nếu có thay đổi scope
- [ ] Document API endpoints (có thể dùng Postman Collection)

### Pre-Launch
- [ ] Tất cả tasks trong plan.md đã completed
- [ ] Tất cả test cases pass
- [ ] Code review (nếu có team)
- [ ] Merge `develop` → `main`
- [ ] Tag version `v1.0.0`

---

## 10. Notes cho Developer

### Best Practices
- **Backend:** Dùng async/await, không dùng callback hell
- **Frontend:** Dùng functional components + hooks, tránh class components
- **Error Handling:** Luôn có try-catch cho async operations
- **Security:** Không commit `.env` file, dùng `.gitignore`
- **Code Style:** Dùng ESLint + Prettier để format code tự động

### Common Pitfalls
- ❌ Quên hash password trước khi lưu vào DB
- ❌ Không validate input → SQL injection / XSS
- ❌ Không check role → unauthorized access
- ❌ Không handle loading state → UI bị freeze
- ❌ Không test trên thiết bị thật → lỗi camera permission

### Quick Start Commands
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npx expo start
```

---

**🎯 Mục tiêu cuối cùng:** Hoàn thành MVP trong 7–10 ngày, sẵn sàng demo với stakeholders.

**📞 Liên hệ:** Nếu gặp blocker, báo ngay để adjust plan.
