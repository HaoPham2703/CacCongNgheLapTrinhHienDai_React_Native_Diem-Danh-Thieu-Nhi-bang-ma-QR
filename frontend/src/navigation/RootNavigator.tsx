import Feather from "@expo/vector-icons/Feather";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, DefaultTheme, NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import { Student } from "../services/api";

import { AdminLayout, AdminScreenKey } from "../components/AdminLayout";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { AdminAttendanceHistoryScreen } from "../screens/admin/AdminAttendanceHistoryScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminNametagScreen } from "../screens/admin/AdminNametagScreen";
import { AdminSettingsScreen } from "../screens/admin/AdminSettingsScreen";
import { ClassesManagementScreen } from "../screens/admin/ClassesManagementScreen";
import { StudentsManagementScreen } from "../screens/admin/StudentsManagementScreen";
import { UsersManagementScreen } from "../screens/admin/UsersManagementScreen";
import { ParentDashboardScreen } from "../screens/parent/ParentDashboardScreen";
import { ParentHistoryScreen } from "../screens/parent/ParentHistoryScreen";
import { QRScannerScreen } from "../screens/teacher/QRScannerScreen";
import { ScanResultScreen } from "../screens/teacher/ScanResultScreen";
import { TeacherHistoryScreen } from "../screens/teacher/TeacherHistoryScreen";

export type RootStackParamList = {
  Login: undefined;
  TeacherTabs: NavigatorScreenParams<TeacherTabParamList>;
  ParentTabs: NavigatorScreenParams<ParentTabParamList>;
  AdminDashboard: undefined;
  ScanResult: { studentId: string; student?: Student };
};

export type TeacherTabParamList = {
  TeacherScanner: undefined;
  TeacherHistory: undefined;
  Profile: undefined;
};

export type ParentTabParamList = {
  ParentDashboard: undefined;
  ParentHistory: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  StudentsManagement: undefined;
  ClassesManagement: undefined;
  AttendanceHistory: undefined;
  UsersManagement: undefined;
  AdminSettings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const TeacherTab = createBottomTabNavigator<TeacherTabParamList>();
const ParentTab = createBottomTabNavigator<ParentTabParamList>();

function AdminDashboardWithLayout() {
  const [currentScreen, setCurrentScreen] = useState<AdminScreenKey>("dashboard");

  const renderScreen = () => {
    switch (currentScreen) {
      case "dashboard":
        return <AdminDashboardScreen navigation={{} as any} route={{} as any} onNavigateSection={setCurrentScreen} />;
      case "students":
        return <StudentsManagementScreen navigation={{} as any} route={{} as any} />;
      case "classes":
        return <ClassesManagementScreen navigation={{} as any} route={{} as any} />;
      case "attendance":
        return <AdminAttendanceHistoryScreen navigation={{} as any} route={{} as any} />;
      case "users":
        return <UsersManagementScreen navigation={{} as any} route={{} as any} />;
      case "nametags":
        return <AdminNametagScreen />;
      case "settings":
        return <AdminSettingsScreen />;
      case "profile":
        return <ProfileScreen />;
    }
  };

  return (
    <AdminLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
      {renderScreen()}
    </AdminLayout>
  );
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textOnDark,
    border: theme.colors.surface,
    primary: theme.colors.primary,
  },
};

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
  headerTintColor: theme.colors.textOnDark,
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: theme.colors.background,
  },
};

const tabScreenOptions = {
  headerStyle: {
    backgroundColor: theme.colors.surface,
  },
  headerTintColor: theme.colors.textOnDark,
  headerShadowVisible: false,
  sceneStyle: {
    backgroundColor: theme.colors.background,
  },
  tabBarStyle: {
    backgroundColor: "#FFFFFF",
    borderTopColor: theme.colors.border,
    height: 68,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabBarActiveTintColor: theme.colors.primary,
  tabBarInactiveTintColor: theme.colors.textSoft,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
};

function TeacherTabNavigator() {
  return (
    <TeacherTab.Navigator screenOptions={tabScreenOptions}>
      <TeacherTab.Screen
        name="TeacherScanner"
        component={QRScannerScreen}
        options={{
          title: "Quét QR điểm danh",
          tabBarLabel: "Quét",
          tabBarIcon: ({ color, size }) => <Feather name="camera" color={color} size={size} />,
        }}
      />
      <TeacherTab.Screen
        name="TeacherHistory"
        component={TeacherHistoryScreen}
        options={{
          title: "Lịch sử điểm danh",
          tabBarLabel: "Lịch sử",
          tabBarIcon: ({ color, size }) => <Feather name="clock" color={color} size={size} />,
        }}
      />
      <TeacherTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Thông tin tài khoản",
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </TeacherTab.Navigator>
  );
}

function ParentTabNavigator() {
  return (
    <ParentTab.Navigator screenOptions={tabScreenOptions}>
      <ParentTab.Screen
        name="ParentDashboard"
        component={ParentDashboardScreen}
        options={{
          title: "Tổng quan phụ huynh",
          tabBarLabel: "Tổng quan",
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <ParentTab.Screen
        name="ParentHistory"
        component={ParentHistoryScreen}
        options={{
          title: "Lịch sử điểm danh",
          tabBarLabel: "Lịch sử",
          tabBarIcon: ({ color, size }) => <Feather name="calendar" color={color} size={size} />,
        }}
      />
      <ParentTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Thông tin tài khoản",
          tabBarLabel: "Tài khoản",
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </ParentTab.Navigator>
  );
}

export function RootNavigator() {
  const { isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <LoadingSpinner fullScreen label="Đang tải phiên đăng nhập..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={stackScreenOptions}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "ClassPulse Login", headerShown: false }} />
        ) : user.role === "teacher" ? (
          <>
            <Stack.Screen name="TeacherTabs" component={TeacherTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ title: "Xác nhận điểm danh" }} />
          </>
        ) : user.role === "admin" ? (
          <Stack.Screen name="AdminDashboard" component={AdminDashboardWithLayout} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="ParentTabs" component={ParentTabNavigator} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
