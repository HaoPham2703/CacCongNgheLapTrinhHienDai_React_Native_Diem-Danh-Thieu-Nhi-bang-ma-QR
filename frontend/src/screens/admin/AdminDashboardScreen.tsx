import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import Feather from "@expo/vector-icons/Feather";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { AdminScreenKey } from "../../components/AdminLayout";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { AdminTabParamList } from "../../navigation/RootNavigator";
import { api } from "../../services/api";

type Props = BottomTabScreenProps<AdminTabParamList, "AdminDashboard">;
type AdminDashboardScreenProps = Props & {
  onNavigateSection?: (screen: AdminScreenKey) => void;
};

type HoverableActionProps = {
  children: ReactNode;
  onPress: () => void;
  style?: object | object[];
  hoverStyle?: object | object[];
  travelX?: number;
  travelY?: number;
  scaleTo?: number;
};

const statConfig = [
  {
    key: "totalStudents" as const,
    label: "Học sinh",
    icon: "users",
    accent: "#38BDF8",
    target: "students" as AdminScreenKey,
  },
  {
    key: "totalClasses" as const,
    label: "Lớp học",
    icon: "book-open",
    accent: "#F59E0B",
    target: "classes" as AdminScreenKey,
  },
  {
    key: "totalTeachers" as const,
    label: "Giáo viên",
    icon: "briefcase",
    accent: "#10B981",
    target: "users" as AdminScreenKey,
  },
  {
    key: "totalParents" as const,
    label: "Phụ huynh",
    icon: "heart",
    accent: "#A78BFA",
    target: "users" as AdminScreenKey,
  },
];

function HoverableAction({
  children,
  onPress,
  style,
  hoverStyle,
  travelX = 0,
  travelY = -6,
  scaleTo = 1.015,
}: HoverableActionProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hoverValue, {
      toValue: isHovered ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [hoverValue, isHovered]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
      <Animated.View
        style={[
          style,
          isHovered && hoverStyle,
          {
            transform: [
              {
                translateX: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, travelX],
                }),
              },
              {
                translateY: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, travelY],
                }),
              },
              {
                scale: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, scaleTo],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export function AdminDashboardScreen({ navigation, onNavigateSection }: AdminDashboardScreenProps) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const [stats, setStats] = useState({ totalStudents: 0, totalClasses: 0, totalTeachers: 0, totalParents: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    const { stats: data } = await api.admin.getStats(token);
    setStats(data);
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

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải..." />;
  }

  const totalUsers = stats.totalTeachers + stats.totalParents;
  const averageStudentsPerClass = stats.totalClasses > 0 ? (stats.totalStudents / stats.totalClasses).toFixed(1) : "0";
  const teacherCoverage = stats.totalClasses > 0 ? Math.min(100, Math.round((stats.totalTeachers / stats.totalClasses) * 100)) : 0;
  const parentReach = stats.totalStudents > 0 ? Math.min(100, Math.round((stats.totalParents / stats.totalStudents) * 100)) : 0;
  const contentWidth = width - 240;
  const isDesktop = contentWidth >= 1100;
  const isLargeDesktop = contentWidth >= 1440;

  function openAdminSection(target: AdminScreenKey) {
    if (onNavigateSection) {
      onNavigateSection(target);
      return;
    }

    navigation.navigate(
      target === "dashboard"
        ? "AdminDashboard"
        : target === "students"
          ? "StudentsManagement"
          : target === "classes"
            ? "ClassesManagement"
            : target === "users"
              ? "UsersManagement"
              : target === "settings"
                ? "AdminSettings"
                : "Profile",
    );
  }

  return (
    <Screen scrollable={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.content, isLargeDesktop && styles.contentLarge]}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Feather name="activity" size={16} color={theme.colors.textOnDark} />
                <Text style={styles.heroBadgeText}>TỔNG QUAN ADMIN</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{stats.totalStudents + stats.totalClasses} mục dữ liệu đang hoạt động</Text>
              </View>
            </View>

            <View style={[styles.heroBody, isDesktop && styles.heroBodyDesktop]}>
              <View style={[styles.heroMain, isDesktop && styles.heroMainDesktop]}>
                <Text style={styles.heroTitle}>Tổng quan hệ thống điểm danh</Text>
                <Text style={styles.heroSubtitle}>
                  Theo dõi quy mô trường lớp, nhân sự và mạng lưới phụ huynh trong cùng một màn hình.
                </Text>
                <HoverableAction
                  style={styles.heroAction}
                  hoverStyle={styles.heroActionHover}
                  onPress={() => openAdminSection("students")}
                  travelX={4}
                  travelY={-2}
                  scaleTo={1.03}
                >
                  <Text style={styles.heroActionText}>Mở quản lý học sinh</Text>
                  <Feather name="arrow-right" size={16} color={theme.colors.textOnDark} />
                </HoverableAction>
              </View>

              <HoverableAction
                style={[styles.heroHighlight, isDesktop && styles.heroHighlightDesktop]}
                hoverStyle={styles.heroHighlightHover}
                onPress={() => openAdminSection("users")}
              >
                <Text style={styles.heroHighlightLabel}>Tổng người dùng</Text>
                <Text style={styles.heroHighlightValue}>{totalUsers}</Text>
                <Text style={styles.heroHighlightHint}>Giáo viên và phụ huynh đang được quản lý</Text>
              </HoverableAction>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {statConfig.map((item) => (
              <View
                key={item.key}
                style={[
                  styles.statColumn,
                  isDesktop ? styles.statColumnDesktop : styles.statColumnTablet,
                ]}
              >
                <HoverableAction
                  style={styles.statCardWrap}
                  hoverStyle={styles.statCardWrapHover}
                  onPress={() => openAdminSection(item.target)}
                >
                  <SurfaceCard>
                    <View style={styles.statCardTop}>
                      <View style={[styles.statIconWrap, { backgroundColor: `${item.accent}22` }]}>
                        <Feather name={item.icon as any} size={18} color={item.accent} />
                      </View>
                      <Text style={[styles.statTrend, { color: item.accent }]}>Đang hoạt động</Text>
                    </View>
                    <Text style={styles.statValue}>{stats[item.key]}</Text>
                    <Text style={styles.statLabel}>{item.label}</Text>
                  </SurfaceCard>
                </HoverableAction>
              </View>
            ))}
          </View>

          <View style={[styles.insightGrid, isDesktop && styles.insightGridDesktop]}>
            <View style={[styles.insightColumn, isDesktop ? styles.insightColumnPrimary : styles.insightColumnStack]}>
              <SurfaceCard>
              <Text style={styles.sectionEyebrow}>Hiệu suất vận hành</Text>
              <Text style={styles.sectionTitle}>Chỉ số nhanh</Text>

              <View style={styles.metricBlock}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Trung bình học sinh mỗi lớp</Text>
                  <Text style={styles.metricValue}>{averageStudentsPerClass}</Text>
                </View>
                <View style={styles.metricBarTrack}>
                  <View style={[styles.metricBarFill, { width: `${Math.min(Number(averageStudentsPerClass) * 4, 100)}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Độ phủ giáo viên theo lớp</Text>
                  <Text style={styles.metricValue}>{teacherCoverage}%</Text>
                </View>
                <View style={styles.metricBarTrack}>
                  <View style={[styles.metricBarFill, styles.teacherFill, { width: `${teacherCoverage}%` }]} />
                </View>
              </View>

              <View style={styles.metricBlock}>
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Kết nối phụ huynh trên học sinh</Text>
                  <Text style={styles.metricValue}>{parentReach}%</Text>
                </View>
                <View style={styles.metricBarTrack}>
                  <View style={[styles.metricBarFill, styles.parentFill, { width: `${parentReach}%` }]} />
                </View>
              </View>
              </SurfaceCard>
            </View>

            <View style={[styles.insightColumn, isDesktop ? styles.insightColumnSecondary : styles.insightColumnStack]}>
              <SurfaceCard>
              <Text style={styles.sectionEyebrow}>Tổng kết nhanh</Text>
              <Text style={styles.sectionTitle}>Điểm nhấn hôm nay</Text>

              <View style={styles.summaryList}>
                <HoverableAction
                  style={styles.summaryItem}
                  hoverStyle={styles.summaryItemHover}
                  onPress={() => openAdminSection("students")}
                  travelX={6}
                  travelY={0}
                  scaleTo={1.01}
                >
                  <View style={[styles.summaryDot, { backgroundColor: "#38BDF8" }]} />
                  <View style={styles.summaryTextWrap}>
                    <Text style={styles.summaryTitle}>Khối học sinh là trung tâm vận hành</Text>
                    <Text style={styles.summaryDescription}>
                      Tổng {stats.totalStudents} học sinh đang nằm trong hệ thống điểm danh.
                    </Text>
                  </View>
                </HoverableAction>

                <HoverableAction
                  style={styles.summaryItem}
                  hoverStyle={styles.summaryItemHover}
                  onPress={() => openAdminSection("classes")}
                  travelX={6}
                  travelY={0}
                  scaleTo={1.01}
                >
                  <View style={[styles.summaryDot, { backgroundColor: "#10B981" }]} />
                  <View style={styles.summaryTextWrap}>
                    <Text style={styles.summaryTitle}>Nhân sự giảng dạy đã được tập hợp</Text>
                    <Text style={styles.summaryDescription}>
                      {stats.totalTeachers} giáo viên đang phụ trách {stats.totalClasses} lớp học.
                    </Text>
                  </View>
                </HoverableAction>

                <HoverableAction
                  style={styles.summaryItem}
                  hoverStyle={styles.summaryItemHover}
                  onPress={() => openAdminSection("users")}
                  travelX={6}
                  travelY={0}
                  scaleTo={1.01}
                >
                  <View style={[styles.summaryDot, { backgroundColor: "#A78BFA" }]} />
                  <View style={styles.summaryTextWrap}>
                    <Text style={styles.summaryTitle}>Kênh phụ huynh đang mở rộng</Text>
                    <Text style={styles.summaryDescription}>
                      {stats.totalParents} tài khoản phụ huynh đã tham gia theo dõi điểm danh.
                    </Text>
                  </View>
                </HoverableAction>
              </View>
              </SurfaceCard>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    width: "100%",
  },
  contentLarge: {
    paddingHorizontal: theme.spacing.xl,
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    borderWidth: 1,
    borderColor: "#2E3F5D",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  heroBadgeText: {
    color: theme.colors.textOnDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroPill: {
    backgroundColor: "#162033",
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  heroPillText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  heroBody: {
    gap: theme.spacing.lg,
  },
  heroBodyDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  heroMain: {
    minWidth: 320,
  },
  heroMainDesktop: {
    flex: 1,
    paddingRight: theme.spacing.xl,
  },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38,
  },
  heroSubtitle: {
    color: theme.colors.textSoft,
    fontSize: 16,
    lineHeight: 25,
    marginTop: theme.spacing.sm,
    maxWidth: 720,
  },
  heroAction: {
    marginTop: theme.spacing.lg,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  heroActionHover: {
    backgroundColor: "#7BB4FA",
  },
  heroActionText: {
    color: theme.colors.textOnDark,
    fontSize: 14,
    fontWeight: "700",
  },
  heroHighlight: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: "#111C2E",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  heroHighlightHover: {
    backgroundColor: "#17263C",
    borderColor: "#48607E",
  },
  heroHighlightDesktop: {
    width: 320,
    justifyContent: "center",
  },
  heroHighlightLabel: {
    color: theme.colors.textSoft,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroHighlightValue: {
    color: theme.colors.text,
    fontSize: 42,
    fontWeight: "800",
    marginTop: theme.spacing.xs,
  },
  heroHighlightHint: {
    color: theme.colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
    marginTop: theme.spacing.xs,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
  },
  statColumn: {
    minWidth: 0,
  },
  statColumnDesktop: {
    width: "23.7%",
  },
  statColumnTablet: {
    width: "48.5%",
  },
  statCardWrap: {
    borderRadius: theme.radius.md,
  },
  statCardWrapHover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  statCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statTrend: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
  },
  statLabel: {
    color: theme.colors.textSoft,
    fontSize: 15,
    marginTop: 6,
  },
  insightGrid: {
    gap: theme.spacing.lg,
  },
  insightGridDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  insightColumn: {
    minWidth: 0,
  },
  insightColumnPrimary: {
    width: "58%",
  },
  insightColumnSecondary: {
    width: "40%",
  },
  insightColumnStack: {
    width: "100%",
  },
  sectionEyebrow: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: theme.spacing.sm,
  },
  metricBlock: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.textSoft,
    fontSize: 14,
    flex: 1,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  metricBarTrack: {
    height: 10,
    backgroundColor: "#162033",
    borderRadius: 999,
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  teacherFill: {
    backgroundColor: theme.colors.success,
  },
  parentFill: {
    backgroundColor: "#A78BFA",
  },
  summaryList: {
    gap: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: -theme.spacing.sm,
  },
  summaryItemHover: {
    backgroundColor: "#17263C",
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 6,
  },
  summaryTextWrap: {
    flex: 1,
  },
  summaryTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  summaryDescription: {
    color: theme.colors.textSoft,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
});
