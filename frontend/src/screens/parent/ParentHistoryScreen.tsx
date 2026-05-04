import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { ParentTabParamList } from "../../navigation/RootNavigator";
import { api, AttendanceRecord } from "../../services/api";

type Props = BottomTabScreenProps<ParentTabParamList, "ParentHistory">;

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
  const day = days[date.getDay()];
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${day}, ${d}/${m}/${y}`;
}

function getMonthRange(monthStr: string): { fromDate: string; toDate: string } {
  const [month, year] = monthStr.split("/").map(Number);
  const fromDate = `${year}-${month.toString().padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${month.toString().padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;
  return { fromDate, toDate };
}

export function ParentHistoryScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const loadRecords = useCallback(async (month?: string) => {
    if (!token) {
      return;
    }

    let query = "";
    if (month) {
      const { fromDate, toDate } = getMonthRange(month);
      query = `?fromDate=${fromDate}&toDate=${toDate}`;
    }

    const response = await api.getAttendance(token, query);
    setRecords(response.records);
  }, [token]);

  useEffect(() => {
    async function initialLoad() {
      try {
        setIsLoading(true);
        await loadRecords();
      } finally {
        setIsLoading(false);
      }
    }

    initialLoad();
  }, [loadRecords]);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadRecords(selectedMonth || undefined);
    } finally {
      setRefreshing(false);
    }
  }

  const availableMonths = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }
    return months;
  }, []);

  useEffect(() => {
    if (availableMonths.length && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      loadRecords(selectedMonth);
    }
  }, [selectedMonth, loadRecords]);

  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);

  const groupedRecords = useMemo(() => {
    const groups = filteredRecords.reduce<Record<string, AttendanceRecord[]>>((acc, record) => {
      if (!acc[record.date]) {
        acc[record.date] = [];
      }
      acc[record.date].push(record);
      return acc;
    }, {});

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRecords]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải lịch sử..." />;
  }

  return (
    <Screen scrollable={false}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.content}>
          {availableMonths.length > 0 && (
            <View style={styles.monthFilter}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableMonths.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[styles.monthButton, selectedMonth === month && styles.monthButtonActive]}
                    onPress={() => setSelectedMonth(month)}
                  >
                    <Text style={[styles.monthText, selectedMonth === month && styles.monthTextActive]}>
                      Tháng {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {groupedRecords.map(([date, dayRecords]) => (
            <SurfaceCard key={date}>
              <Text style={styles.dateTitle}>{formatDateHeader(date)}</Text>
              {dayRecords.map((record) => (
                <View key={record.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.studentName}>{record.student?.fullName || "Học sinh"}</Text>
                    <Text style={styles.meta}>
                      {record.status === "present" ? "Có mặt" : "Vắng mặt"} •{" "}
                      {new Date(record.checkInTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      record.status === "present" ? styles.statusPresent : styles.statusAbsent,
                    ]}
                  >
                    <Text style={styles.statusText}>{record.status === "present" ? "✓" : "✗"}</Text>
                  </View>
                </View>
              ))}
            </SurfaceCard>
          ))}

          {!filteredRecords.length ? (
            <SurfaceCard>
              <Text style={styles.emptyText}>Chưa có lịch sử điểm danh trong tháng này.</Text>
            </SurfaceCard>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  monthFilter: {
    marginBottom: theme.spacing.sm,
  },
  monthButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  monthText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  monthTextActive: {
    color: "#fff",
  },
  dateTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLeft: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 15,
  },
  meta: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPresent: {
    backgroundColor: theme.colors.successSoft,
  },
  statusAbsent: {
    backgroundColor: theme.colors.dangerSoft,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: theme.colors.textSoft,
    textAlign: "center",
    fontStyle: "italic",
  },
});
