import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "react-native-qrcode-svg";
import {
  Image,
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
import { QRModal } from "../../components/admin/QRModal";
import { ErrorToast } from "../../components/ErrorToast";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { AdminTabParamList } from "../../navigation/RootNavigator";
import { api, ClassItem, Student, User } from "../../services/api";

type Props = BottomTabScreenProps<AdminTabParamList, "StudentsManagement">;
type SortKey = "studentCode" | "fullName" | "className";
type StudentFormData = {
  studentCode: string;
  fullName: string;
  classId: string;
  parentIds: string[];
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  avatar: string;
  status: "active" | "graduated" | "transferred";
  isActive: boolean;
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const tableColumns: Array<{ key: SortKey; label: string; minWidth: number; weight: number }> = [
  { key: "studentCode", label: "Mã học sinh", minWidth: 180, weight: 1.1 },
  { key: "fullName", label: "Họ và tên", minWidth: 280, weight: 1.8 },
  { key: "className", label: "Lớp", minWidth: 180, weight: 1.1 },
];

const genderOptions = [
  { value: "male" as const, label: "Nam" },
  { value: "female" as const, label: "Nữ" },
  { value: "other" as const, label: "Khác" },
];

const statusOptions = [
  { value: "active" as const, label: "Đang học" },
  { value: "graduated" as const, label: "Đã tốt nghiệp" },
  { value: "transferred" as const, label: "Đã chuyển trường" },
];

const activeOptions = [
  { value: true, label: "Đang kích hoạt" },
  { value: false, label: "Tạm khóa" },
];

function createInitialFormData(): StudentFormData {
  return {
    studentCode: "",
    fullName: "",
    classId: "",
    parentIds: [],
    dateOfBirth: "",
    gender: "male",
    address: "",
    avatar: "",
    status: "active",
    isActive: true,
  };
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "Chưa cập nhật";
  }

  return String(value).slice(0, 10);
}

function formatDateTimeLabel(value?: string) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatGenderLabel(gender?: Student["gender"]) {
  return genderOptions.find((option) => option.value === gender)?.label || "Chưa cập nhật";
}

function formatStatusLabel(status?: Student["status"]) {
  return statusOptions.find((option) => option.value === status)?.label || "Chưa cập nhật";
}

function formatActiveLabel(isActive?: boolean) {
  if (isActive === undefined) {
    return "Chưa cập nhật";
  }

  return isActive ? "Đang kích hoạt" : "Tạm khóa";
}

function getInitials(fullName?: string) {
  if (!fullName) {
    return "HS";
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function StudentsManagementScreen(_: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [qrModalVisible, setQRModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("studentCode");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState<StudentFormData>(createInitialFormData);

  const loadData = useCallback(async () => {
    if (!token) return;

    const [studentsRes, classesRes, parentsRes] = await Promise.all([
      api.getStudents(token),
      api.getClasses(token),
      api.admin.listUsers(token, "?role=parent"),
    ]);

    setStudents(studentsRes.students);
    setClasses(classesRes.classes);
    setParents(parentsRes.users);
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

  function openCreateModal() {
    setEditingStudent(null);
    setFormData(createInitialFormData());
    setError(null);
    setModalVisible(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setFormData({
      studentCode: student.studentCode,
      fullName: student.fullName,
      classId: student.classId,
      parentIds: student.parentIds,
      dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : "",
      gender: student.gender || "male",
      address: student.address || "",
      avatar: student.avatar || "",
      status: student.status || "active",
      isActive: student.isActive ?? true,
    });
    setError(null);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!token) return;

    try {
      setError(null);

      if (editingStudent) {
        await api.updateStudent(token, editingStudent.id, {
          fullName: formData.fullName,
          classId: formData.classId,
          parentIds: formData.parentIds,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address,
          avatar: formData.avatar,
          status: formData.status,
          isActive: formData.isActive,
        });
      } else {
        await api.createStudent(token, formData);
      }

      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    }
  }

  async function handleDelete(studentId: string) {
    if (!token) return;

    try {
      await api.deleteStudent(token, studentId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xóa");
    }
  }

  function openStudentDetail(student: Student) {
    setSelectedStudent(student);
    setDetailModalVisible(true);
  }

  function openQRModal(student: Student) {
    setSelectedStudent(student);
    setQRModalVisible(true);
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const data = normalizedQuery
      ? students.filter((student) =>
          [student.studentCode, student.fullName, student.className].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        )
      : students;

    return [...data].sort((left, right) => {
      const leftValue = left[sortKey].toLowerCase();
      const rightValue = right[sortKey].toLowerCase();
      const result = leftValue.localeCompare(rightValue, "vi");
      return sortDirection === "asc" ? result : -result;
    });
  }, [searchQuery, sortDirection, sortKey, students]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const selectedClassName = classes.find((item) => item.id === formData.classId)?.className || "Chưa chọn lớp";
  const selectedParents = parents.filter((parent) => formData.parentIds.includes(parent.id));
  const detailParents = parents.filter((parent) => selectedStudent?.parentIds.includes(parent.id));
  const actionColumnWidth = 280;
  const desktopContentWidth = Math.max(width - 240 - 72, 860);
  const studentWeightTotal = tableColumns.reduce((total, column) => total + column.weight, 0);
  const studentContentWidth = Math.max(desktopContentWidth - actionColumnWidth, 620);
  const studentColumnWidths = tableColumns.map((column) =>
    Math.max(column.minWidth, (studentContentWidth * column.weight) / studentWeightTotal),
  );
  const tableWidth = studentColumnWidths.reduce((total, columnWidth) => total + columnWidth, actionColumnWidth);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải..." />;
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
            <Text style={styles.title}>Quản lý học sinh</Text>
            <Text style={styles.subtitle}>
              Theo dõi danh sách, tìm kiếm nhanh và cập nhật đầy đủ hồ sơ học sinh.
            </Text>
          </View>
          <PrimaryButton label="Thêm học sinh" onPress={openCreateModal} />
        </View>

        <SurfaceCard>
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={theme.colors.textSoft} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo mã, họ tên hoặc lớp"
                placeholderTextColor={theme.colors.textSoft}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.toolbarMeta}>
              <Text style={styles.metaText}>{filteredStudents.length} học sinh</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>
                Sắp xếp: {tableColumns.find((item) => item.key === sortKey)?.label}
              </Text>
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
                    style={[styles.headerCell, { width: studentColumnWidths[index] }]}
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
                <View style={[styles.headerCell, styles.actionHeaderCell]}>
                  <Text style={styles.headerCellText}>Hành động</Text>
                </View>
              </View>

              {paginatedStudents.map((student) => (
                <HoverablePanel
                  key={student.id}
                  style={styles.tableRowWrap}
                  hoverStyle={styles.tableRowWrapHover}
                  onPress={() => openStudentDetail(student)}
                >
                  <View style={styles.tableRow}>
                    <View style={[styles.bodyCell, { width: studentColumnWidths[0] }]}>
                      <Text style={styles.studentCode}>{student.studentCode}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: studentColumnWidths[1] }]}>
                      <Text style={styles.primaryText}>{student.fullName}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: studentColumnWidths[2] }]}>
                      <Text style={styles.secondaryText}>{student.className}</Text>
                    </View>
                    <View style={[styles.bodyCell, styles.actionsCell]}>
                      <HoverableButton
                        label="QR"
                        onPress={() => openQRModal(student)}
                        style={styles.actionButton}
                        hoverStyle={styles.actionButtonHover}
                      />
                      <HoverableButton
                        label="Sửa"
                        onPress={() => openEditModal(student)}
                        style={styles.actionButton}
                        hoverStyle={styles.actionButtonHover}
                      />
                      <HoverableButton
                        label="Xóa"
                        onPress={() => handleDelete(student.id)}
                        style={[styles.actionButton, styles.deleteButton]}
                        hoverStyle={styles.deleteButtonHover}
                      />
                    </View>
                  </View>
                </HoverablePanel>
              ))}

              {!filteredStudents.length ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Không có học sinh phù hợp</Text>
                  <Text style={styles.emptyDescription}>
                    Thử đổi từ khóa tìm kiếm hoặc thêm học sinh mới.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {filteredStudents.length ? (
            <AdminPagination
              currentPage={safeCurrentPage}
              totalItems={filteredStudents.length}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="học sinh"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </SurfaceCard>
      </ScrollView>

      <Modal visible={detailModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailKicker}>Thông tin học sinh</Text>
                <Text style={styles.detailTitle}>{selectedStudent?.fullName || "Chưa có dữ liệu"}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                <Feather name="x" size={18} color={theme.colors.textSoft} />
              </TouchableOpacity>
            </View>

            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Mã học sinh</Text>
              <Text style={styles.codeValue}>{selectedStudent?.studentCode || "--"}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailHeroRow}>
                <View style={styles.avatarCard}>
                  <Text style={styles.detailLabel}>Ảnh đại diện</Text>
                  {selectedStudent?.avatar ? (
                    <Image source={{ uri: selectedStudent.avatar }} style={styles.avatarImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarFallbackText}>{getInitials(selectedStudent?.fullName)}</Text>
                    </View>
                  )}
                  <Text style={styles.avatarCaption}>
                    {selectedStudent?.avatar ? "Ảnh hồ sơ học sinh" : "Chưa có ảnh đại diện"}
                  </Text>
                </View>

                <TouchableOpacity style={styles.qrCard} onPress={() => selectedStudent && openQRModal(selectedStudent)}>
                  <Text style={styles.detailLabel}>Mã QR học sinh</Text>
                  <View style={styles.qrPreview}>
                    <QRCode value={selectedStudent?.studentCode || "--"} size={132} backgroundColor="white" />
                  </View>
                  <Text style={styles.qrCaption}>Bấm để mở QR lớn</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Lớp</Text>
                  <Text style={styles.detailValue}>{selectedStudent?.className || "Chưa rõ"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ngày sinh</Text>
                  <Text style={styles.detailValue}>{formatDateLabel(selectedStudent?.dateOfBirth)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Giới tính</Text>
                  <Text style={styles.detailValue}>{formatGenderLabel(selectedStudent?.gender)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Trạng thái</Text>
                  <Text style={styles.detailValue}>{formatStatusLabel(selectedStudent?.status)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kích hoạt</Text>
                  <Text style={styles.detailValue}>{formatActiveLabel(selectedStudent?.isActive)}</Text>
                </View>
                <View style={styles.detailItemWide}>
                  <Text style={styles.detailLabel}>Địa chỉ</Text>
                  <Text style={styles.detailValue}>{selectedStudent?.address || "Chưa cập nhật"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tạo lúc</Text>
                  <Text style={styles.detailValue}>{formatDateTimeLabel(selectedStudent?.createdAt)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Cập nhật lúc</Text>
                  <Text style={styles.detailValue}>{formatDateTimeLabel(selectedStudent?.updatedAt)}</Text>
                </View>
              </View>

              <View style={styles.parentSection}>
                <Text style={styles.detailLabel}>Phụ huynh liên kết</Text>
                {detailParents.length ? (
                  detailParents.map((parent) => (
                    <View key={parent.id} style={styles.parentDetailRow}>
                      <Text style={styles.parentDetailName}>{parent.fullName}</Text>
                      <Text style={styles.parentDetailMeta}>{parent.email}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.parentEmpty}>Chưa có phụ huynh liên kết</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.detailActions}>
              <PrimaryButton
                label="Xem QR lớn"
                onPress={() => selectedStudent && openQRModal(selectedStudent)}
                variant="secondary"
              />
              <PrimaryButton
                label="Sửa học sinh"
                onPress={() => {
                  if (selectedStudent) {
                    setDetailModalVisible(false);
                    openEditModal(selectedStudent);
                  }
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingStudent ? "Cập nhật học sinh" : "Thêm học sinh mới"}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formBody}>
                {!editingStudent && (
                  <TextInput
                    style={styles.input}
                    placeholder="Mã học sinh"
                    placeholderTextColor={theme.colors.textSoft}
                    value={formData.studentCode}
                    onChangeText={(text) => setFormData({ ...formData, studentCode: text })}
                  />
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Họ và tên"
                  placeholderTextColor={theme.colors.textSoft}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Ngày sinh (YYYY-MM-DD)"
                  placeholderTextColor={theme.colors.textSoft}
                  value={formData.dateOfBirth}
                  onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
                />

                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Địa chỉ"
                  placeholderTextColor={theme.colors.textSoft}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                />

                <TextInput
                  style={styles.input}
                  placeholder="Link ảnh đại diện"
                  placeholderTextColor={theme.colors.textSoft}
                  value={formData.avatar}
                  onChangeText={(text) => setFormData({ ...formData, avatar: text })}
                  autoCapitalize="none"
                />

                <Text style={styles.formLabel}>Giới tính</Text>
                <View style={styles.selectionGrid}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFormData({ ...formData, gender: option.value })}
                      style={[styles.selectionChip, formData.gender === option.value && styles.selectionChipActive]}
                    >
                      <Text style={styles.selectionChipText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Trạng thái</Text>
                <View style={styles.selectionGrid}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setFormData({ ...formData, status: option.value })}
                      style={[styles.selectionChip, formData.status === option.value && styles.selectionChipActive]}
                    >
                      <Text style={styles.selectionChipText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Kích hoạt</Text>
                <View style={styles.selectionGrid}>
                  {activeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.label}
                      onPress={() => setFormData({ ...formData, isActive: option.value })}
                      style={[styles.selectionChip, formData.isActive === option.value && styles.selectionChipActive]}
                    >
                      <Text style={styles.selectionChipText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Chọn lớp</Text>
                <Text style={styles.selectionSummary}>{selectedClassName}</Text>
                <View style={styles.selectionGrid}>
                  {classes.map((classItem) => (
                    <TouchableOpacity
                      key={classItem.id}
                      onPress={() => setFormData({ ...formData, classId: classItem.id })}
                      style={[styles.selectionChip, formData.classId === classItem.id && styles.selectionChipActive]}
                    >
                      <Text style={styles.selectionChipText}>{classItem.className}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Phụ huynh liên kết</Text>
                <Text style={styles.selectionSummary}>
                  {selectedParents.length
                    ? selectedParents.map((parent) => parent.fullName).join(", ")
                    : "Chưa chọn phụ huynh"}
                </Text>
                <ScrollView style={styles.parentList} contentContainerStyle={styles.parentListContent}>
                  {parents.map((parent) => {
                    const isSelected = formData.parentIds.includes(parent.id);
                    return (
                      <TouchableOpacity
                        key={parent.id}
                        onPress={() =>
                          setFormData((current) => ({
                            ...current,
                            parentIds: isSelected
                              ? current.parentIds.filter((id) => id !== parent.id)
                              : [...current.parentIds, parent.id],
                          }))
                        }
                        style={[styles.parentItem, isSelected && styles.parentItemActive]}
                      >
                        <View style={styles.parentItemText}>
                          <Text style={styles.parentName}>{parent.fullName}</Text>
                          <Text style={styles.parentEmail}>{parent.email}</Text>
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
              </View>
            </ScrollView>

            <ErrorToast message={error} />

            <View style={styles.modalActions}>
              <PrimaryButton label="Hủy" onPress={() => setModalVisible(false)} variant="secondary" />
              <PrimaryButton label="Lưu" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>

      <QRModal
        visible={qrModalVisible}
        studentCode={selectedStudent?.studentCode || ""}
        studentName={selectedStudent?.fullName || ""}
        onClose={() => setQRModalVisible(false)}
      />
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
  tableScrollContent: {
    paddingTop: theme.spacing.md,
  },
  table: {
    minWidth: 860,
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
  actionHeaderCell: {
    width: 280,
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
  actionsCell: {
    width: 280,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  studentCode: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700",
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
  deleteButton: {
    backgroundColor: theme.colors.danger,
  },
  deleteButtonHover: {
    backgroundColor: "#F87171",
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
    maxHeight: "92%",
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
  },
  detailModalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
    maxWidth: 860,
    width: "100%",
    maxHeight: "92%",
    alignSelf: "center",
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  formBody: {
    gap: theme.spacing.md,
    paddingRight: 4,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  detailKicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  closeButton: {
    padding: theme.spacing.sm,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
  },
  codeCard: {
    backgroundColor: "#162033",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  codeLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  codeValue: {
    color: theme.colors.primary,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  detailHeroRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatarCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  avatarImage: {
    width: 170,
    height: 170,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing.md,
  },
  avatarFallback: {
    width: 170,
    height: 170,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.md,
  },
  avatarFallbackText: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: "800",
  },
  avatarCaption: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  qrCard: {
    width: 260,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  qrPreview: {
    padding: theme.spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.md,
  },
  qrCaption: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: theme.spacing.sm,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  detailItem: {
    width: "48%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailItemWide: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailLabel: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  parentSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  parentDetailRow: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  parentDetailName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  parentDetailMeta: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: 3,
  },
  parentEmpty: {
    color: theme.colors.textSoft,
    fontSize: 14,
  },
  detailActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "flex-end",
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  formLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  selectionSummary: {
    color: theme.colors.textSoft,
    fontSize: 13,
    marginTop: -4,
  },
  selectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  selectionChip: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectionChipActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  selectionChipText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  parentList: {
    maxHeight: 220,
  },
  parentListContent: {
    gap: theme.spacing.sm,
  },
  parentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  parentItemActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  parentItemText: {
    flex: 1,
  },
  parentName: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  parentEmail: {
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
