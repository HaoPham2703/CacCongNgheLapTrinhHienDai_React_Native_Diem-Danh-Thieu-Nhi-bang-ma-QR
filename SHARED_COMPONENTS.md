# Shared Components - ClassPulse Attendance

## 1. Layout Components

### **AppContainer**
- Wrapper chung cho tất cả screens
- SafeAreaView + StatusBar
- Background color consistent
- **Dùng ở:** Tất cả screens

### **Header**
- Title + optional back button + optional right actions
- **Dùng ở:** TeacherHistoryScreen, ParentHistoryScreen, ProfileScreen

---

## 2. UI Components

### **Button**
- Primary/Secondary variants
- Loading state
- Disabled state
- **Dùng ở:** LoginScreen, ScanResultScreen, ProfileScreen

### **Input**
- TextInput với label
- Error message display
- Secure entry (password)
- **Dùng ở:** LoginScreen

### **Card**
- Container với shadow/border
- **Dùng ở:** ParentDashboardScreen (status card), History lists

### **Avatar**
- Hiển thị ảnh user/student
- Fallback với initials
- **Dùng ở:** ScanResultScreen, ProfileScreen, History items

### **Badge**
- Status badge: Có mặt (green), Vắng (red), Muộn (yellow)
- **Dùng ở:** ScanResultScreen, TeacherHistoryScreen, ParentHistoryScreen

---

## 3. Feedback Components

### **LoadingSpinner**
- Full-screen overlay hoặc inline
- **Dùng ở:** LoginScreen, ScanResultScreen (khi gọi API), History screens

### **Toast**
- Success/Error/Info messages
- Auto-dismiss
- **Dùng ở:** Tất cả screens khi có API call

### **EmptyState**
- Icon + message khi không có data
- Optional action button
- **Dùng ở:** TeacherHistoryScreen, ParentHistoryScreen (khi list trống)

### **ErrorBoundary**
- Catch errors toàn app
- Fallback UI
- **Dùng ở:** App root

---

## 4. List Components

### **AttendanceListItem**
- Hiển thị 1 bản ghi điểm danh
- Props: studentName, className, time, status
- Reusable cho cả Teacher & Parent
- **Dùng ở:** TeacherHistoryScreen, ParentHistoryScreen

### **SectionHeader**
- Header cho grouped list (theo date)
- **Dùng ở:** History screens

---

## 5. Modal Components

### **ConfirmModal**
- Title + message + 2 buttons (Cancel/Confirm)
- **Dùng ở:** ProfileScreen (logout), ScanResultScreen (nếu cần confirm)

### **SuccessModal**
- Icon check + message
- Auto-dismiss sau 2s
- **Dùng ở:** ScanResultScreen (sau điểm danh thành công)

---

## 6. Utility Components

### **Divider**
- Horizontal line separator
- **Dùng ở:** ProfileScreen, List items

### **Spacer**
- Vertical/horizontal spacing
- **Dùng ở:** Tất cả screens

---

## Tổng kết

**Tổng: 17 shared components**

### Ưu tiên triển khai:

**Phase 1 (Critical):**
1. AppContainer
2. Button
3. Input
4. LoadingSpinner
5. Toast
6. Header

**Phase 2 (Important):**
7. Card
8. Badge
9. AttendanceListItem
10. EmptyState

**Phase 3 (Nice-to-have):**
11. Avatar
12. ConfirmModal
13. SuccessModal
14. SectionHeader
15. Divider
16. Spacer
17. ErrorBoundary

---

## Cấu trúc thư mục đề xuất

```
src/
├── components/
│   ├── shared/
│   │   ├── layout/
│   │   │   ├── AppContainer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Spacer.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Divider.tsx
│   │   ├── feedback/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── modals/
│   │   │   ├── ConfirmModal.tsx
│   │   │   └── SuccessModal.tsx
│   │   └── list/
│   │       ├── AttendanceListItem.tsx
│   │       └── SectionHeader.tsx
│   └── index.ts (export tất cả)
```
