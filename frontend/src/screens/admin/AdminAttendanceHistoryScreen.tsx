import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { HoverablePanel } from "../../components/admin/AdminHover";
import { AdminPagination } from "../../components/admin/AdminPagination";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { AdminTabParamList } from "../../navigation/RootNavigator";
import { api, AttendanceRecord } from "../../services/api";

type Props = BottomTabScreenProps<AdminTabParamList, "AttendanceHistory">;
type SortKey = "studentName" | "studentCode" | "className" | "date" | "status";
type StatusFilter = "all" | "present" | "late" | "absent";
type AttendanceViewRecord = AttendanceRecord & {
  studentName: string;
  studentCodeLabel: string;
  classNameLabel: string;
  dateLabel: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "present", label: "Có mặt" },
  { value: "late", label: "Đi muộn" },
  { value: "absent", label: "Vắng" },
];

const tableColumns: Array<{ key: SortKey; label: string; minWidth: number; weight: number }> = [
  { key: "studentName", label: "Học sinh", minWidth: 260, weight: 1.8 },
  { key: "studentCode", label: "Mã", minWidth: 140, weight: 1 },
  { key: "className", label: "Lớp", minWidth: 160, weight: 1 },
  { key: "date", label: "Ngày", minWidth: 160, weight: 1 },
  { key: "status", label: "Trạng thái", minWidth: 140, weight: 1 },
];

function formatStatusLabel(status: AttendanceRecord["status"]) {
  if (status === "present") return "Có mặt";
  if (status === "late") return "Đi muộn";
  return "Vắng";
}

function formatSourceLabel(source: string) {
  return source === "QR" ? "QR" : "Thủ công";
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(date);
}

function formatTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", { timeStyle: "short" }).format(date);
}

export function AdminAttendanceHistoryScreen(_: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    const response = await api.getAttendance(token);
    setRecords(response.records);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortKey, sortDirection, pageSize]);

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => records.some((record) => record.id === id)));
  }, [records]);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "date" ? "desc" : "asc");
  }

  function toggleSelection(recordId: string) {
    setSelectedIds((current) =>
      current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId],
    );
  }

  const preparedRecords = useMemo<AttendanceViewRecord[]>(
    () =>
      records.map((record) => ({
        ...record,
        studentName: record.student?.fullName || "Học sinh không xác định",
        studentCodeLabel: record.student?.studentCode || "--",
        classNameLabel: record.student?.className || "--",
        dateLabel: formatDateLabel(record.date),
      })),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const baseData =
      statusFilter === "all" ? preparedRecords : preparedRecords.filter((record) => record.status === statusFilter);

    const searchedData = normalizedQuery
      ? baseData.filter((record) =>
          [
            record.studentName,
            record.studentCodeLabel,
            record.classNameLabel,
            formatStatusLabel(record.status),
            record.notes || "",
          ].some((value) => value.toLowerCase().includes(normalizedQuery)),
        )
      : baseData;

    return [...searchedData].sort((left, right) => {
      const leftValue =
        sortKey === "studentCode"
          ? left.studentCodeLabel
          : sortKey === "studentName"
            ? left.studentName
            : sortKey === "className"
              ? left.classNameLabel
              : sortKey === "status"
                ? formatStatusLabel(left.status)
                : left.date;

      const rightValue =
        sortKey === "studentCode"
          ? right.studentCodeLabel
          : sortKey === "studentName"
            ? right.studentName
            : sortKey === "className"
              ? right.classNameLabel
              : sortKey === "status"
                ? formatStatusLabel(right.status)
                : right.date;

      const result =
        sortKey === "date"
          ? new Date(leftValue).getTime() - new Date(rightValue).getTime()
          : String(leftValue).localeCompare(String(rightValue), "vi");

      return sortDirection === "asc" ? result : -result;
    });
  }, [preparedRecords, searchQuery, sortDirection, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredRecords.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const todayLabel = formatDateLabel(new Date().toISOString());

  const pageIds = paginatedRecords.map((record) => record.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  function togglePageSelection() {
    setSelectedIds((current) =>
      allPageSelected ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])],
    );
  }

  async function handleDeleteSelected() {
    if (!token || isDeleting || !selectedIds.length) return;

    try {
      setIsDeleting(true);
      await Promise.all(selectedIds.map((id) => api.deleteAttendance(token, id)));
      setSelectedIds([]);
      await loadData();
    } finally {
      setIsDeleting(false);
    }
  }

  const selectColumnWidth = 92;
  const metaColumnWidth = 250;
  const desktopContentWidth = Math.max(width - 240 - 72, 1160);
  const weightTotal = tableColumns.reduce((total, column) => total + column.weight, 0);
  const contentWidth = Math.max(desktopContentWidth - metaColumnWidth - selectColumnWidth, 760);
  const columnWidths = tableColumns.map((column) =>
    Math.max(column.minWidth, (contentWidth * column.weight) / weightTotal),
  );
  const tableWidth =
    columnWidths.reduce((total, columnWidth) => total + columnWidth, selectColumnWidth + metaColumnWidth);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải lịch sử điểm danh..." />;
  }

  return (
    <Screen scrollable={false}>
      <ScrollView
        contentContainerStyle={styles.page}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Lịch sử điểm danh</Text>
            <Text style={styles.subtitle}>
              Xem toàn bộ bản ghi điểm danh, tìm kiếm nhanh, lọc trạng thái và xóa theo lô.
            </Text>
          </View>
        </View>

        <SurfaceCard>
          <View style={styles.content}>
            <View style={styles.toolbar}>
              <View style={styles.searchBox}>
                <Feather name="search" size={18} color={theme.colors.textSoft} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo học sinh, mã, lớp hoặc ghi chú"
                  placeholderTextColor={theme.colors.textSoft}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.toolbarMeta}>
                <Text style={styles.metaText}>{filteredRecords.length} bản ghi</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>
                  Hôm nay: {records.filter((record) => formatDateLabel(record.date) === todayLabel).length}
                </Text>
              </View>
            </View>

            <View style={styles.filterRow}>
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => setStatusFilter(filter.value)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{filter.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.bulkBar}>
              <View style={styles.bulkMeta}>
                <Text style={styles.bulkText}>Đã chọn {selectedIds.length} bản ghi</Text>
                {selectedIds.length ? (
                  <TouchableOpacity onPress={() => setSelectedIds([])}>
                    <Text style={styles.clearSelectionText}>Bỏ chọn tất cả</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <PrimaryButton
                label={isDeleting ? "Đang xóa..." : "Xóa đã chọn"}
                onPress={handleDeleteSelected}
                disabled={!selectedIds.length || isDeleting}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View style={[styles.table, { width: Math.max(desktopContentWidth, tableWidth) }]}>
                <View style={styles.tableHeader}>
                  <TouchableOpacity style={[styles.headerCell, styles.selectHeaderCell]} onPress={togglePageSelection}>
                    <Feather
                      name={allPageSelected ? "check-square" : "square"}
                      size={16}
                      color={allPageSelected ? theme.colors.primary : theme.colors.textSoft}
                    />
                    <Text style={styles.headerCellText}>Chọn</Text>
                  </TouchableOpacity>

                  {tableColumns.map((column, index) => (
                    <TouchableOpacity
                      key={column.key}
                      style={[styles.headerCell, { width: columnWidths[index] }]}
                      onPress={() => toggleSort(column.key)}
                    >
                      <Text style={styles.headerCellText}>{column.label}</Text>
                      <Feather
                        name={sortKey === column.key && sortDirection === "desc" ? "chevron-down" : "chevron-up"}
                        size={14}
                        color={sortKey === column.key ? theme.colors.primary : theme.colors.textSoft}
                      />
                    </TouchableOpacity>
                  ))}

                  <View style={[styles.headerCell, styles.metaHeaderCell]}>
                    <Text style={styles.headerCellText}>Chi tiết</Text>
                  </View>
                </View>

                {paginatedRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <HoverablePanel key={record.id} style={styles.tableRowWrap} hoverStyle={styles.tableRowWrapHover}>
                      <View style={styles.tableRow}>
                        <TouchableOpacity
                          style={[styles.bodyCell, styles.selectCell]}
                          onPress={() => toggleSelection(record.id)}
                        >
                          <Feather
                            name={isSelected ? "check-square" : "square"}
                            size={18}
                            color={isSelected ? theme.colors.primary : theme.colors.textSoft}
                          />
                        </TouchableOpacity>

                        <View style={[styles.bodyCell, { width: columnWidths[0] }]}>
                          <Text style={styles.primaryText}>{record.studentName}</Text>
                        </View>
                        <View style={[styles.bodyCell, { width: columnWidths[1] }]}>
                          <Text style={styles.secondaryText}>{record.studentCodeLabel}</Text>
                        </View>
                        <View style={[styles.bodyCell, { width: columnWidths[2] }]}>
                          <Text style={styles.secondaryText}>{record.classNameLabel}</Text>
                        </View>
                        <View style={[styles.bodyCell, { width: columnWidths[3] }]}>
                          <Text style={styles.secondaryText}>{record.dateLabel}</Text>
                        </View>
                        <View style={[styles.bodyCell, { width: columnWidths[4] }]}>
                          <View
                            style={[
                              styles.statusBadge,
                              record.status === "present"
                                ? styles.statusPresent
                                : record.status === "late"
                                  ? styles.statusLate
                                  : styles.statusAbsent,
                            ]}
                          >
                            <Text style={styles.statusBadgeText}>{formatStatusLabel(record.status)}</Text>
                          </View>
                        </View>
                        <View style={[styles.bodyCell, styles.metaCell]}>
                          <Text style={styles.metaBlock}>Giờ vào: {formatTimeLabel(record.checkInTime)}</Text>
                          <Text style={styles.metaBlock}>Nguồn: {formatSourceLabel(record.source)}</Text>
                          <Text style={styles.metaBlock}>{record.notes || "Không có ghi chú"}</Text>
                        </View>
                      </View>
                    </HoverablePanel>
                  );
                })}

                {!filteredRecords.length ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Không có bản ghi phù hợp</Text>
                    <Text style={styles.emptyDescription}>Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>

            {filteredRecords.length ? (
              <AdminPagination
                currentPage={safeCurrentPage}
                totalItems={filteredRecords.length}
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                itemLabel="bản ghi"
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            ) : null}
          </View>
        </SurfaceCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textSoft,
    fontSize: 15,
    marginTop: 6,
  },
  content: {
    gap: theme.spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  searchBox: {
    minWidth: 360,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: "#162033",
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
  },
  toolbarMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flexWrap: "wrap",
  },
  metaText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  metaDot: {
    color: theme.colors.textSoft,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  filterChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: theme.colors.text,
  },
  bulkBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  bulkMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  bulkText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  clearSelectionText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  tableScrollContent: {
    paddingTop: theme.spacing.md,
  },
  table: {
    minWidth: 1160,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
  },
  selectHeaderCell: {
    width: 92,
  },
  metaHeaderCell: {
    width: 250,
  },
  headerCellText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRowWrap: {
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
  },
  tableRowWrapHover: {
    backgroundColor: "#162033",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 86,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  bodyCell: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "center",
  },
  selectCell: {
    width: 92,
    alignItems: "center",
  },
  primaryText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryText: {
    color: theme.colors.textSoft,
    fontSize: 14,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  statusPresent: {
    backgroundColor: theme.colors.success,
  },
  statusLate: {
    backgroundColor: theme.colors.warning,
  },
  statusAbsent: {
    backgroundColor: theme.colors.danger,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  metaCell: {
    width: 250,
    gap: 4,
  },
  metaBlock: {
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyDescription: {
    color: theme.colors.textSoft,
    fontSize: 14,
    marginTop: 6,
  },
});
