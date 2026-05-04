import { API_BASE_URL } from "./config";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || "Request failed", response.status);
  }

  return data as T;
}

export type UserRole = "teacher" | "parent" | "admin";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Student = {
  id: string;
  studentCode: string;
  fullName: string;
  classId: string;
  className: string;
  parentIds: string[];
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  avatar?: string;
  status?: "active" | "graduated" | "transferred";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  student: {
    id: string;
    studentCode: string;
    fullName: string;
    classId: string;
    className: string;
  } | null;
  classId: string;
  date: string;
  status: "present" | "late" | "absent";
  checkInTime: string;
  teacherId: string;
  source: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type ClassItem = {
  id: string;
  classId: string;
  className: string;
  grade: string;
  academicYear?: string;
  teacherId: string;
  studentCount?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type AttendanceSettings = {
  id: string;
  schoolStartTime: string;
  lateGracePeriodMinutes: number;
};

export const api = {
  login(email: string, password: string) {
    return request<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
  getMe(token: string) {
    return request<{ user: AuthUser }>("/users/me", { token });
  },
  getStudents(token: string, query = "") {
    return request<{ students: Student[] }>(`/students${query}`, { token });
  },
  createStudent(
    token: string,
    data: {
      studentCode: string;
      fullName: string;
      classId: string;
      parentIds: string[];
      dateOfBirth: string;
      gender: "male" | "female" | "other";
      address?: string;
      avatar?: string;
      status?: "active" | "graduated" | "transferred";
    }
  ) {
    return request<{ student: Student }>("/students", {
      method: "POST",
      token,
      body: data,
    });
  },
  updateStudent(
    token: string,
    studentId: string,
    data: {
      studentCode?: string;
      fullName?: string;
      classId?: string;
      parentIds?: string[];
      dateOfBirth?: string;
      gender?: "male" | "female" | "other";
      address?: string;
      avatar?: string;
      status?: "active" | "graduated" | "transferred";
      isActive?: boolean;
    }
  ) {
    return request<{ student: Student }>(`/students/${studentId}`, {
      method: "PUT",
      token,
      body: data,
    });
  },
  deleteStudent(token: string, studentId: string) {
    return request<{ message: string }>(`/students/${studentId}`, {
      method: "DELETE",
      token,
    });
  },
  getMyChildren(token: string) {
    return request<{ students: Student[] }>("/students/me/children", { token });
  },
  getStudentById(token: string, studentId: string) {
    return request<{ student: Student }>(`/students/${studentId}`, { token });
  },
  getAttendance(token: string, query = "") {
    return request<{ records: AttendanceRecord[] }>(`/attendance${query}`, { token });
  },
  checkIn(token: string, studentId: string, checkInTime?: string, attendanceDate?: string) {
    return request<{ attendance: AttendanceRecord; meta: { wasCreated: boolean } }>(
      "/attendance/check-in",
      {
        method: "POST",
        token,
        body: {
          studentId,
          ...(checkInTime ? { checkInTime } : {}),
          ...(attendanceDate ? { attendanceDate } : {})
        },
      }
    );
  },
  deleteAttendance(token: string, attendanceId: string) {
    return request<{ message: string }>(`/attendance/${attendanceId}`, {
      method: "DELETE",
      token,
    });
  },
  getNotifications(token: string) {
    return request<{ notifications: NotificationItem[] }>("/notifications", { token });
  },
  markAllNotificationsRead(token: string) {
    return request<{ updatedCount: number; message: string }>("/notifications/read-all", {
      method: "PATCH",
      token,
    });
  },
  getClasses(token: string, teacherOnly = false) {
    const suffix = teacherOnly ? "?teacherOnly=true" : "";
    return request<{ classes: ClassItem[] }>(`/classes${suffix}`, { token });
  },
  updateClass(token: string, classId: string, data: { teacherId?: string }) {
    return request<{ class: ClassItem }>(`/classes/${classId}`, {
      method: "PUT",
      token,
      body: data,
    });
  },
  admin: {
    getStats(token: string) {
      return request<{ stats: { totalStudents: number; totalClasses: number; totalTeachers: number; totalParents: number } }>("/admin/stats", { token });
    },
    listUsers(token: string, query = "") {
      return request<{ users: User[] }>(`/admin/users${query}`, { token });
    },
    createUser(token: string, data: { fullName: string; email: string; password: string; phone?: string; role: "teacher" | "parent" }) {
      return request<{ user: User }>("/admin/users", {
        method: "POST",
        token,
        body: data,
      });
    },
    updateUser(token: string, userId: string, data: { fullName?: string; email?: string; phone?: string; role?: UserRole; isActive?: boolean }) {
      return request<{ user: User }>(`/admin/users/${userId}`, {
        method: "PUT",
        token,
        body: data,
      });
    },
    deleteUser(token: string, userId: string) {
      return request<{ message: string }>(`/admin/users/${userId}`, {
        method: "DELETE",
        token,
      });
    },
    assignTeacherToClass(token: string, classId: string, teacherId: string) {
      return request<{ class: ClassItem }>(`/admin/classes/${classId}/assign-teacher`, {
        method: "PUT",
        token,
        body: { teacherId },
      });
    },
    getAttendanceSettings(token: string) {
      return request<{ settings: AttendanceSettings }>("/admin/attendance-settings", { token });
    },
    updateAttendanceSettings(token: string, data: { schoolStartTime: string; lateGracePeriodMinutes: number }) {
      return request<{ settings: AttendanceSettings }>("/admin/attendance-settings", {
        method: "PUT",
        token,
        body: data,
      });
    },
  },
};
