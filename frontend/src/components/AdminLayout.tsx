import Feather from "@expo/vector-icons/Feather";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export type AdminScreenKey =
  | "dashboard"
  | "students"
  | "classes"
  | "attendance"
  | "users"
  | "nametags"
  | "settings"
  | "profile";

type AdminLayoutProps = {
  children: React.ReactNode;
  currentScreen: AdminScreenKey;
  onNavigate: (screen: AdminScreenKey) => void;
};

type SidebarMenuItemProps = {
  active: boolean;
  icon: string;
  label: string;
  onPress: () => void;
};

type HoverIconButtonProps = {
  children: ReactNode;
  onPress: () => void;
};

function SidebarMenuItem({ active, icon, label, onPress }: SidebarMenuItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverValue = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(hoverValue, {
      toValue: active || isHovered ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [active, hoverValue, isHovered]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
      <Animated.View
        style={[
          styles.menuItem,
          active && styles.menuItemActive,
          isHovered && !active && styles.menuItemHover,
          {
            transform: [
              {
                translateX: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 6],
                }),
              },
              {
                scale: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.015],
                }),
              },
            ],
          },
        ]}
      >
        <Feather
          name={icon as never}
          size={20}
          color={active || isHovered ? theme.colors.primary : theme.colors.textSoft}
        />
        <Text style={[styles.menuText, active && styles.menuTextActive, isHovered && !active && styles.menuTextHover]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function HoverIconButton({ children, onPress }: HoverIconButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(hoverValue, {
      toValue: isHovered ? 1 : 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [hoverValue, isHovered]);

  return (
    <Pressable onPress={onPress} onHoverIn={() => setIsHovered(true)} onHoverOut={() => setIsHovered(false)}>
      <Animated.View
        style={[
          styles.logoutButton,
          isHovered && styles.logoutButtonHover,
          {
            transform: [
              {
                scale: hoverValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
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

export function AdminLayout({ children, currentScreen, onNavigate }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslate.setValue(16);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslate, currentScreen]);

  const menuItems = [
    { key: "dashboard" as const, label: "Tổng quan", icon: "bar-chart-2" },
    { key: "students" as const, label: "Học sinh", icon: "users" },
    { key: "classes" as const, label: "Lớp học", icon: "book" },
    { key: "attendance" as const, label: "Điểm danh", icon: "calendar" },
    { key: "users" as const, label: "Người dùng", icon: "user-check" },
    { key: "settings" as const, label: "Cài đặt", icon: "settings" },
    { key: "profile" as const, label: "Tài khoản", icon: "user" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.logo}>ClassPulse</Text>
          <Text style={styles.logoSub}>Admin</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <SidebarMenuItem
              key={item.key}
              active={currentScreen === item.key}
              icon={item.icon}
              label={item.label}
              onPress={() => onNavigate(item.key)}
            />
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <HoverIconButton onPress={signOut}>
            <Feather name="log-out" size={18} color={theme.colors.danger} />
          </HoverIconButton>
        </View>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslate }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    flexDirection: "row",
    backgroundColor: theme.colors.background,
  },
  sidebar: {
    width: 240,
    backgroundColor: theme.colors.surface,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  sidebarHeader: {
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  logo: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  logoSub: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  menu: {
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primarySoft,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  menuItemHover: {
    backgroundColor: "#18253B",
  },
  menuText: {
    color: theme.colors.textSoft,
    fontSize: 15,
    fontWeight: "500",
  },
  menuTextActive: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  menuTextHover: {
    color: theme.colors.text,
  },
  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  userEmail: {
    color: theme.colors.textSoft,
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    padding: theme.spacing.sm,
    borderRadius: 999,
  },
  logoutButtonHover: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  content: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
  },
});
