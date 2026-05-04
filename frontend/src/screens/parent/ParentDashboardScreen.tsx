import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { ParentTabParamList } from "../../navigation/RootNavigator";
import { api, AttendanceRecord, NotificationItem, Student } from "../../services/api";

type Props = BottomTabScreenProps<ParentTabParamList, "ParentDashboard">;

export function ParentDashboardScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    const [childrenResponse, attendanceResponse, notificationResponse] = await Promise.all([
      api.getMyChildren(token),
      api.getAttendance(token),
      api.getNotifications(token),
    ]);

    setChildren(childrenResponse.students);
    setAttendance(attendanceResponse.records);
    setNotifications(notificationResponse.notifications);
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

  const todayRecord = attendance[0];
  const weeklyPresentCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return attendance.filter(
      (record) => record.status === "present" && new Date(record.date) >= sevenDaysAgo
    ).length;
  }, [attendance]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải tổng quan..." />;
  }

  return (
    <Screen scrollable={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.content}>
          <SurfaceCard>
            <Text style={styles.kicker}>Xin chào {user?.fullName}</Text>
            <Text style={styles.title}>Tình hình điểm danh hôm nay</Text>
            <Text style={styles.statusText}>
              {todayRecord
                ? `Đã điểm danh lúc ${new Date(todayRecord.checkInTime).toLocaleTimeString()}`
                : "Chưa có thông tin điểm danh hôm nay"}
            </Text>
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.cardTitle}>Thông tin con</Text>
            {children.map((child) => (
              <View key={child.id} style={styles.childRow}>
                <Text style={styles.childName}>{child.fullName}</Text>
                <Text style={styles.childMeta}>
                  {child.studentCode} - {child.className}
                </Text>
              </View>
            ))}
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.cardTitle}>Thống kê nhanh</Text>
            <Text style={styles.metric}>{weeklyPresentCount} ngày có mặt trong 7 ngày qua</Text>
            <PrimaryButton label="Xem lịch sử" onPress={() => navigation.navigate("ParentHistory")} />
          </SurfaceCard>

          <SurfaceCard>
            <Text style={styles.cardTitle}>Thông báo gần đây</Text>
            {notifications.slice(0, 3).map((item) => (
              <View key={item.id} style={styles.notificationRow}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationText}>{item.message}</Text>
              </View>
            ))}
            {!notifications.length ? (
              <Text style={styles.emptyText}>Chưa có thông báo nào.</Text>
            ) : null}
          </SurfaceCard>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  kicker: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "700",
    marginTop: theme.spacing.xs,
    lineHeight: 34,
  },
  statusText: {
    color: theme.colors.textSoft,
    fontSize: 16,
    lineHeight: 24,
    marginTop: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  childRow: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  childName: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 16,
  },
  childMeta: {
    color: theme.colors.textSoft,
    fontSize: 14,
    marginTop: 2,
  },
  metric: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "700",
    marginVertical: theme.spacing.sm,
  },
  notificationRow: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  notificationTitle: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  notificationText: {
    color: theme.colors.textSoft,
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  emptyText: {
    color: theme.colors.textSoft,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
});
