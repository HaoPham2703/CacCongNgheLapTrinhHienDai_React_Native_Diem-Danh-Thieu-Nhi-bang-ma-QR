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
import { api, User, UserRole } from "../../services/api";

type Props = BottomTabScreenProps<AdminTabParamList, "UsersManagement">;
type SortKey = "fullName" | "email" | "role";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const tableColumns: Array<{ key: SortKey; label: string; minWidth: number; weight: number }> = [
  { key: "fullName", label: "Họ tên", minWidth: 260, weight: 1.5 },
  { key: "email", label: "Email", minWidth: 280, weight: 1.7 },
  { key: "role", label: "Vai trò", minWidth: 160, weight: 1 },
];

export function UsersManagementScreen(_: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    role: "teacher" as "teacher" | "parent",
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    const { users: data } = await api.admin.listUsers(token);
    setUsers(data);
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
    setEditingUser(null);
    setFormData({ fullName: "", email: "", password: "", phone: "", role: "teacher" });
    setError(null);
    setModalVisible(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: "",
      phone: user.phone,
      role: user.role === "admin" ? "teacher" : (user.role as "teacher" | "parent"),
    });
    setError(null);
    setModalVisible(true);
  }

  async function handleSave() {
    if (!token) return;

    try {
      setError(null);
      if (editingUser) {
        await api.admin.updateUser(token, editingUser.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        });
      } else {
        await api.admin.createUser(token, formData);
      }
      setModalVisible(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu");
    }
  }

  async function handleDelete(userId: string) {
    if (!token) return;

    try {
      await api.admin.deleteUser(token, userId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xóa");
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  function getRoleLabel(role: UserRole) {
    if (role === "admin") return "Admin";
    if (role === "teacher") return "Giáo viên";
    return "Phụ huynh";
  }

  function getRoleStyle(role: UserRole) {
    if (role === "admin") return styles.roleBadgeAdmin;
    if (role === "teacher") return styles.roleBadgeTeacher;
    return styles.roleBadgeParent;
  }

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const data = normalizedQuery
      ? users.filter((user) =>
          [user.fullName, user.email, user.phone, getRoleLabel(user.role)].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        )
      : users;

    return [...data].sort((left, right) => {
      const leftValue = (sortKey === "role" ? getRoleLabel(left.role) : left[sortKey]).toLowerCase();
      const rightValue = (sortKey === "role" ? getRoleLabel(right.role) : right[sortKey]).toLowerCase();
      const result = leftValue.localeCompare(rightValue, "vi");
      return sortDirection === "asc" ? result : -result;
    });
  }, [searchQuery, sortDirection, sortKey, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);
  const phoneColumnWidth = 180;
  const actionColumnWidth = 220;
  const desktopContentWidth = Math.max(width - 240 - 72, 1100);
  const userWeightTotal = tableColumns.reduce((total, column) => total + column.weight, 0);
  const userContentWidth = Math.max(desktopContentWidth - phoneColumnWidth - actionColumnWidth, 700);
  const userColumnWidths = tableColumns.map((column) =>
    Math.max(column.minWidth, (userContentWidth * column.weight) / userWeightTotal),
  );
  const tableWidth =
    userColumnWidths.reduce((total, columnWidth) => total + columnWidth, 0) + phoneColumnWidth + actionColumnWidth;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải..." />;
  }

  return (
    <Screen scrollable={false}>
      <View style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quản lý người dùng</Text>
            <Text style={styles.subtitle}>
              Quản trị tài khoản, vai trò và cập nhật thông tin đăng nhập cơ bản.
            </Text>
          </View>
          <PrimaryButton label="Thêm người dùng" onPress={openCreateModal} />
        </View>

        <SurfaceCard>
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color={theme.colors.textSoft} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm theo họ tên, email, điện thoại hoặc vai trò"
                placeholderTextColor={theme.colors.textSoft}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.toolbarMeta}>
              <Text style={styles.metaText}>{filteredUsers.length} người dùng</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{users.filter((user) => user.role === "teacher").length} giáo viên</Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>{users.filter((user) => user.role === "parent").length} phụ huynh</Text>
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
                    style={[styles.headerCell, { width: userColumnWidths[index] }]}
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
                <View style={[styles.headerCell, { width: 180 }]}>
                  <Text style={styles.headerCellText}>Điện thoại</Text>
                </View>
                <View style={[styles.headerCell, { width: 220 }]}>
                  <Text style={styles.headerCellText}>CRUD</Text>
                </View>
              </View>

              {paginatedUsers.map((user) => (
                <HoverablePanel key={user.id} style={styles.tableRowWrap} hoverStyle={styles.tableRowWrapHover}>
                  <View style={styles.tableRow}>
                    <View style={[styles.bodyCell, { width: userColumnWidths[0] }]}>
                      <Text style={styles.primaryText}>{user.fullName}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: userColumnWidths[1] }]}>
                      <Text style={styles.secondaryText}>{user.email}</Text>
                    </View>
                    <View style={[styles.bodyCell, { width: userColumnWidths[2] }]}>
                      <View style={[styles.roleBadge, getRoleStyle(user.role)]}>
                        <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
                      </View>
                    </View>
                    <View style={[styles.bodyCell, { width: 180 }]}>
                      <Text style={styles.secondaryText}>{user.phone || "Chưa cập nhật"}</Text>
                    </View>
                    <View style={[styles.bodyCell, styles.actionsCell]}>
                      {user.role !== "admin" ? (
                        <>
                          <HoverableButton
                            label="Sửa"
                            onPress={() => openEditModal(user)}
                            style={styles.actionButton}
                            hoverStyle={styles.actionButtonHover}
                          />
                          <HoverableButton
                            label="Xóa"
                            onPress={() => handleDelete(user.id)}
                            style={[styles.actionButton, styles.deleteButton]}
                            hoverStyle={styles.deleteButtonHover}
                          />
                        </>
                      ) : (
                        <Text style={styles.adminLockText}>Tài khoản hệ thống</Text>
                      )}
                    </View>
                  </View>
                </HoverablePanel>
              ))}

              {!filteredUsers.length ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Không có người dùng phù hợp</Text>
                  <Text style={styles.emptyDescription}>
                    Hãy đổi bộ lọc tìm kiếm hoặc tạo tài khoản mới.
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {filteredUsers.length ? (
            <AdminPagination
              currentPage={safeCurrentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              itemLabel="người dùng"
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </SurfaceCard>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? "Cập nhật người dùng" : "Tạo người dùng mới"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Họ tên"
              placeholderTextColor={theme.colors.textSoft}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={theme.colors.textSoft}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {!editingUser && (
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                placeholderTextColor={theme.colors.textSoft}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                secureTextEntry
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={theme.colors.textSoft}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>Vai trò</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === "teacher" && styles.roleOptionActive]}
                onPress={() => setFormData({ ...formData, role: "teacher" })}
              >
                <Text style={styles.roleOptionText}>Giáo viên</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, formData.role === "parent" && styles.roleOptionActive]}
                onPress={() => setFormData({ ...formData, role: "parent" })}
              >
                <Text style={styles.roleOptionText}>Phụ huynh</Text>
              </TouchableOpacity>
            </View>

            <ErrorToast message={error} />

            <View style={styles.modalActions}>
              <PrimaryButton label="Hủy" onPress={() => setModalVisible(false)} variant="secondary" />
              <PrimaryButton label="Lưu" onPress={handleSave} />
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
    minWidth: 1100,
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
  actionsCell: {
    width: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
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
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.sm,
  },
  roleBadgeAdmin: {
    backgroundColor: theme.colors.danger,
  },
  roleBadgeTeacher: {
    backgroundColor: theme.colors.primary,
  },
  roleBadgeParent: {
    backgroundColor: theme.colors.success,
  },
  roleBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
  adminLockText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontStyle: "italic",
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
  roleSelector: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  roleOption: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleOptionActive: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  roleOptionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
});
