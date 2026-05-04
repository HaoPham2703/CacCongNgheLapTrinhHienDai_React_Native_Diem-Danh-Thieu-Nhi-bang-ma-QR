import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { HoverableButton, HoverablePanel } from "../../components/admin/AdminHover";
import { AdminPagination } from "../../components/admin/AdminPagination";
import { ErrorToast } from "../../components/ErrorToast";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { AdminTabParamList } from "../../navigation/RootNavigator";
import { api, ClassItem, User } from "../../services/api";

type Props = BottomTabScreenProps<AdminTabParamList, "ClassesManagement">;
type SortKey = "className" | "grade" | "academicYear";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const tableColumns: Array<{ key: SortKey; label: string; minWidth: number; weight: number }> = [
  { key: "className", label: "Tên lớp", minWidth: 240, weight: 1.8 },
  { key: "grade", label: "Khối", minWidth: 140, weight: 0.9 },
  { key: "academicYear", label: "Năm học", minWidth: 180, weight: 1.1 },
];

export function ClassesManagementScreen(_: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("className");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createForm, setCreateForm] = useState({
    className: "",
    grade: "",
    academicYear: "",
    teacherId: "",
  });

  const loadData = useCallback(async () => {
    if (!token) return;

    const [classesRes, teachersRes] = await Promise.all([
      api.getClasses(token),
      api.admin.listUsers(token, "?role=teacher"),
    ]);

    setClasses(classesRes.classes);
    setTeachers(teachersRes.users.filter((teacher) => teacher.isActive));
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
  }, [searchQuery, sortKey, sortDirection, pageSize]);

  async function onRefresh() {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  function openAssignModal(classItem: ClassItem) {
    setSelectedClass(classItem);
    setSelectedTeacherId(classItem.teacherId);
    setError(null);
    setModalVisible(true);
  }

  function openCreateModal() {
    const defaultTeacherId = teachers[0]?.id || "";
    setCreateForm({
      className: "",
      grade: "",
      academicYear: "",
      teacherId: defaultTeacherId,
    });
    setCreateError(null);
    setCreateModalVisible(true);
  }

  async function handleAssign() {
    if (!token || !selectedClass) return;

    try {
      setError(null);
      await api.admin.assignTeacherToClass(token, selectedClass.id, selectedTeacherId);
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi gán giáo viên");
    }
  }

  async function handleCreateClass() {
    if (!token) return;

    const className = createForm.className.trim();
    const grade = createForm.grade.trim();
    const academicYear = createForm.academicYear.trim();
    const teacherId = createForm.teacherId.trim();

    if (!className || !grade || !academicYear || !teacherId) {
      setCreateError("Vui lòng nhập đầy đủ thông tin và chọn giáo viên chủ nhiệm");
      return;
    }

    try {
      setCreateError(null);
      await api.createClass(token, {
        className,
        grade,
        academicYear,
        teacherId,
      });
      setCreateModalVisible(false);
      await loadData();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Lỗi khi tạo lớp học");
    }
  }

  function getTeacherName(teacherId: string) {
    return teachers.find((teacher) => teacher.id === teacherId)?.fullName || "Chưa gán";
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const filteredClasses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const data = normalizedQuery
      ? classes.filter((classItem) =>
          [classItem.classId, classItem.className, classItem.grade, getTeacherName(classItem.teacherId)].some(
            (value) => (value || "").toLowerCase().includes(normalizedQuery),
          ),
        )
      : classes;

    return [...data].sort((left, right) => {
      const leftValue = String(left[sortKey] || "").toLowerCase();
      const rightValue = String(right[sortKey] || "").toLowerCase();
      const result = leftValue.localeCompare(rightValue, "vi");
      return sortDirection === "asc" ? result : -result;
    });
  }, [classes, searchQuery, sortDirection, sortKey, teachers]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedClasses = filteredClasses.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const teacherColumnWidth = 260;
  const actionColumnWidth = 180;
  const desktopContentWidth = Math.max(width - 240 - 72, 1000);
  const classWeightTotal = tableColumns.reduce((total, column) => total + column.weight, 0);
  const classContentWidth = Math.max(desktopContentWidth - teacherColumnWidth - actionColumnWidth, 560);
  const classColumnWidths = tableColumns.map((column) =>
    Math.max(column.minWidth, (classContentWidth * column.weight) / classWeightTotal),
  );
  const tableWidth =
    classColumnWidths.reduce((total, columnWidth) => total + columnWidth, 0) + teacherColumnWidth + actionColumnWidth;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải..." />;
  }

  return (
    <Screen scrollable={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quản lý lớp học</Text>
            <Text style={styles.subtitle}>
              Sắp xếp danh sách lớp, tìm nhanh và gán giáo viên trực tiếp.
            </Text>
          </View>
          <View style={styles.headerActions}>
            <PrimaryButton label="Thêm lớp học mới" onPress={openCreateModal} />
            <PrimaryButton label="Làm mới dữ liệu" onPress={onRefresh} variant="secondary" />
          </View>
        </View>

        <SurfaceCard>
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={theme.colors.textSoft} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo tên lớp, khối, năm học hoặc giáo viên"
                placeholderTextColor={theme.colors.textSoft}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.toolbarMeta}>
              <Text style={styles.metaText}>{filteredClasses.length} lớp học</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{teachers.length} giáo viên sẵn sàng gán</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableScrollContent}
          >
            <View style={[styles.table, { width: Math.max(desktopContentWidth, tableWidth) }]}>
              <View style={styles.tableHeader}>
                {tableColumns.map((column, index) => (
                  <TouchableOpacity
                    key={column.key}
                    style={[styles.headerCell, { width: classColumnWidths[index] }]}
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
                <View style={[styles.headerCell, { width: 260 }]}>
                  <Text style={styles.headerCellText}>Giáo viên phụ trách</Text>
                </View>
                <View style={[styles.headerCell, { width: 180 }]}>
                  <Text style={styles.headerCellText}>Gán</Text>
                </View>
              </View>

              {paginatedClasses.map((classItem) => (
                <HoverablePanel key={classItem.id} style={styles.tableRowWrap} hoverStyle={styles.tableRowWrapHover}>
                  <View style={styles.tableRow}>
                    <View style={[styles.bodyCell, { width: classColumnWidths[0] }]}>
                      <Text style={styles.primaryText}>{classItem.className}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: classColumnWidths[1] }]}>
                      <Text style={styles.secondaryText}>{classItem.grade}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: classColumnWidths[2] }]}>
                      <Text style={styles.secondaryText}>{classItem.academicYear || "Chưa rõ"}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: 260 }]}>
                      <Text style={styles.secondaryText}>{getTeacherName(classItem.teacherId)}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: 180 }]}>
                      <HoverableButton
                        label="Gán giáo viên"
                        onPress={() => openAssignModal(classItem)}
                        style={styles.actionButton}
                        hoverStyle={styles.actionButtonHover}
                      />
                    </View>
                  </View>
                </HoverablePanel>
              ))}

              {!filteredClasses.length ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Không có lớp phù hợp</Text>
                  <Text style={styles.emptyDescription}>
                    Thử thay từ khóa tìm kiếm để xem lại dữ liệu.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {filteredClasses.length ? (
            <AdminPagination
              currentPage={safeCurrentPage}
              totalItems={filteredClasses.length}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="lớp học"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </SurfaceCard>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gán giáo viên cho {selectedClass?.className}</Text>
            <Text style={styles.modalSubtitle}>
              Chọn một giáo viên trong danh sách bên dưới để cập nhật lớp.
            </Text>

            <ScrollView style={styles.teacherList} contentContainerStyle={styles.teacherListContent}>
              {teachers.map((teacher) => {
                const isSelected = selectedTeacherId === teacher.id;
                return (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[styles.teacherItem, isSelected && styles.teacherItemSelected]}
                    onPress={() => setSelectedTeacherId(teacher.id)}
                  >
                    <View style={styles.teacherText}>
                      <Text style={styles.teacherName}>{teacher.fullName}</Text>
                      <Text style={styles.teacherEmail}>{teacher.email}</Text>
                    </View>
                    <Feather
                      name={isSelected ? "check-circle" : "circle"}
                      size={18}
                      color={isSelected ? theme.colors.primary : theme.colors.textSoft}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ErrorToast message={error} />

            <View style={styles.modalActions}>
              <PrimaryButton label="Hủy" onPress={() => setModalVisible(false)} variant="secondary" />
              <PrimaryButton label="Lưu gán" onPress={handleAssign} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tạo lớp học mới</Text>
            <Text style={styles.modalSubtitle}>Nhập thông tin lớp và chọn giáo viên chủ nhiệm.</Text>

            <TextInput
              style={styles.input}
              placeholder="Tên lớp (ví dụ: 1A1)"
              placeholderTextColor={theme.colors.textSoft}
              value={createForm.className}
              onChangeText={(text) => setCreateForm((prev) => ({ ...prev, className: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Khối (ví dụ: 1)"
              placeholderTextColor={theme.colors.textSoft}
              value={createForm.grade}
              onChangeText={(text) => setCreateForm((prev) => ({ ...prev, grade: text }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Năm học (ví dụ: 2026-2027)"
              placeholderTextColor={theme.colors.textSoft}
              value={createForm.academicYear}
              onChangeText={(text) => setCreateForm((prev) => ({ ...prev, academicYear: text }))}
            />

            <Text style={styles.formLabel}>Giáo viên chủ nhiệm</Text>
            <ScrollView style={styles.teacherList} contentContainerStyle={styles.teacherListContent}>
              {teachers.map((teacher) => {
                const isSelected = createForm.teacherId === teacher.id;
                return (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[styles.teacherItem, isSelected && styles.teacherItemSelected]}
                    onPress={() => setCreateForm((prev) => ({ ...prev, teacherId: teacher.id }))}
                  >
                    <View style={styles.teacherText}>
                      <Text style={styles.teacherName}>{teacher.fullName}</Text>
                      <Text style={styles.teacherEmail}>{teacher.email}</Text>
                    </View>
                    <Feather
                      name={isSelected ? "check-circle" : "circle"}
                      size={18}
                      color={isSelected ? theme.colors.primary : theme.colors.textSoft}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <ErrorToast message={createError} />

            <View style={styles.modalActions}>
              <PrimaryButton label="Hủy" onPress={() => setCreateModalVisible(false)} variant="secondary" />
              <PrimaryButton label="Tạo lớp" onPress={handleCreateClass} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: theme.spacing.lg,
    flex: 1,
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
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  searchBox: {
    minWidth: 380,
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
  tableScrollContent: {
    paddingTop: theme.spacing.md,
  },
  table: {
    minWidth: 1000,
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
    minHeight: 74,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  bodyCell: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: "center",
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
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  actionButtonHover: {
    backgroundColor: "#7BB4FA",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
    maxHeight: "85%",
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    fontSize: 16,
  },
  formLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  modalSubtitle: {
    color: theme.colors.textSoft,
    fontSize: 14,
    marginTop: -4,
  },
  teacherList: {
    maxHeight: 320,
  },
  teacherListContent: {
    gap: theme.spacing.sm,
  },
  teacherItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teacherItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  teacherText: {
    flex: 1,
  },
  teacherName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  teacherEmail: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
