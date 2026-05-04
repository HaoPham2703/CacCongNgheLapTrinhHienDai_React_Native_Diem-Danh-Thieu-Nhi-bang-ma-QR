import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ErrorToast } from "../../components/ErrorToast";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { TeacherTabParamList } from "../../navigation/RootNavigator";
import { AttendanceRecord, api } from "../../services/api";
import {
  PendingAttendanceItem,
  getPendingAttendanceQueue,
  removePendingAttendanceRecord,
  syncPendingAttendanceQueue,
} from "../../services/offlineAttendanceQueue";

type Props = BottomTabScreenProps<TeacherTabParamList, "TeacherHistory">;

function formatStatusLabel(status: AttendanceRecord["status"] | PendingAttendanceItem["status"]) {
  if (status === "present") return "Có mặt";
  if (status === "late") return "Đi muộn";
  return "Vắng";
}

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function TeacherHistoryScreen(_: Props) {
  const { token } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<PendingAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const queue = await getPendingAttendanceQueue();
    setPendingRecords(queue.sort((left, right) => right.queuedAt.localeCompare(left.queuedAt)));

    if (!token) {
      setRecords([]);
      return;
    }

    try {
      const response = await api.getAttendance(token);
      setRecords(response.records);
      setError(null);
    } catch (loadError) {
      setRecords([]);
      setError(
        loadError instanceof Error
          ? `${loadError.message}. Bạn vẫn có thể xem và gửi các bản ghi đang chờ.`
          : "Không thể tải lịch sử đã đồng bộ. Bạn vẫn có thể gửi các bản ghi đang chờ.",
      );
    }
  }, [token]);

  useEffect(() => {
    async function initialLoad() {
      try {
        setIsLoading(true);
        await loadData();
      } finally {
        setIsLoading(false);
      }
    }

    initialLoad();
  }, [loadData]);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeletePending(recordId: string) {
    await removePendingAttendanceRecord(recordId);
    await loadData();
  }

  async function handleSyncPending() {
    if (!token || !pendingRecords.length || isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      setSuccessMessage(null);

      const result = await syncPendingAttendanceQueue(token);
      await loadData();

      if (result.failedCount) {
        setError(`Đã gửi ${result.syncedCount} bản ghi. Còn ${result.failedCount} bản ghi chưa gửi được.`);
      } else {
        setSuccessMessage(`Đã gửi thành công ${result.syncedCount} bản ghi điểm danh.`);
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Không thể gửi điểm danh lúc này.");
    } finally {
      setIsSyncing(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải lịch sử..." />;
  }

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <SurfaceCard>
          <Text style={styles.title}>Hàng chờ điểm danh</Text>
          <Text style={styles.subtitle}>
            Sau khi quét, bản ghi sẽ được lưu cục bộ trên thiết bị. Khi có mạng, bấm gửi để đồng bộ lên hệ thống.
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{pendingRecords.length} bản ghi đang chờ gửi</Text>
            <PrimaryButton
              label={isSyncing ? "Đang gửi điểm danh..." : "Gửi điểm danh"}
              onPress={handleSyncPending}
              disabled={!pendingRecords.length || isSyncing}
            />
          </View>
          <ErrorToast message={error} />
          {successMessage ? (
            <View style={styles.successToast}>
              <Text style={styles.successToastText}>{successMessage}</Text>
            </View>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Chờ gửi</Text>
          {pendingRecords.length ? (
            <View style={styles.listWrap}>
              {pendingRecords.map((record) => (
                <View key={record.id} style={styles.pendingCard}>
                  <View style={styles.pendingTop}>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.studentName}>{record.studentName}</Text>
                      <Text style={styles.meta}>
                        {record.studentCode} - {record.className}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeletePending(record.id)} style={styles.deleteButton}>
                      <Text style={styles.deleteButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.meta}>Lưu lúc: {formatTimeLabel(record.queuedAt)}</Text>
                  <Text style={styles.statusPending}>Chờ gửi • {formatStatusLabel(record.status)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Không có bản ghi nào đang chờ gửi.</Text>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Đã đồng bộ</Text>
          {records.length ? (
            <View style={styles.listWrap}>
              {records.map((record) => (
                <View key={record.id} style={styles.syncedCard}>
                  <Text style={styles.studentName}>{record.student?.fullName || "Học sinh"}</Text>
                  <Text style={styles.meta}>
                    {record.student?.studentCode || "--"} - {record.student?.className || record.classId}
                  </Text>
                  <Text style={styles.meta}>Check-in: {formatTimeLabel(record.checkInTime)}</Text>
                  <Text style={styles.statusSynced}>{formatStatusLabel(record.status)}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Chưa có bản ghi nào đã gửi lên hệ thống.</Text>
          )}
        </SurfaceCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textSoft,
    lineHeight: 21,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  successToast: {
    backgroundColor: "rgba(16, 185, 129, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.45)",
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  successToastText: {
    color: "#6EE7B7",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  listWrap: {
    gap: theme.spacing.sm,
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: theme.colors.warning,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  syncedCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  pendingTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  pendingInfo: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  meta: {
    color: theme.colors.textSoft,
    fontSize: 14,
  },
  statusPending: {
    color: theme.colors.warning,
    fontWeight: "800",
  },
  statusSynced: {
    color: theme.colors.success,
    fontWeight: "800",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  deleteButtonText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    color: theme.colors.textSoft,
    fontSize: 14,
  },
});
