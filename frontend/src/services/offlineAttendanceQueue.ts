import AsyncStorage from "@react-native-async-storage/async-storage";

import { api, Student } from "./api";

const STORAGE_KEY = "classpulse.teacher.pendingAttendance";

export type PendingAttendanceItem = {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  className: string;
  attendanceDate: string;
  queuedAt: string;
  status: "present";
  notes: string;
};

function buildQueueId(studentId: string, attendanceDate: string) {
  return `${studentId}-${attendanceDate}`;
}

async function saveQueue(items: PendingAttendanceItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getPendingAttendanceQueue() {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [] as PendingAttendanceItem[];
  }

  try {
    const parsed = JSON.parse(rawValue) as PendingAttendanceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function queueAttendanceRecord(student: Student) {
  const attendanceDate = new Date().toISOString().slice(0, 10);
  const queuedAt = new Date().toISOString();
  const item: PendingAttendanceItem = {
    id: buildQueueId(student.id, attendanceDate),
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.fullName,
    classId: student.classId,
    className: student.className,
    attendanceDate,
    queuedAt,
    status: "present",
    notes: "",
  };

  const currentQueue = await getPendingAttendanceQueue();
  const nextQueue = [...currentQueue.filter((entry) => entry.id !== item.id), item].sort((left, right) =>
    right.queuedAt.localeCompare(left.queuedAt),
  );

  await saveQueue(nextQueue);
  return item;
}

export async function removePendingAttendanceRecord(recordId: string) {
  const currentQueue = await getPendingAttendanceQueue();
  const nextQueue = currentQueue.filter((entry) => entry.id !== recordId);
  await saveQueue(nextQueue);
  return nextQueue;
}

export async function syncPendingAttendanceQueue(token: string) {
  const queue = await getPendingAttendanceQueue();
  const remaining: PendingAttendanceItem[] = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      await api.checkIn(token, item.studentId, item.queuedAt, item.queuedAt);
      syncedCount += 1;
    } catch {
      remaining.push(item);
    }
  }

  await saveQueue(remaining);

  return {
    syncedCount,
    failedCount: remaining.length,
    remaining,
  };
}
