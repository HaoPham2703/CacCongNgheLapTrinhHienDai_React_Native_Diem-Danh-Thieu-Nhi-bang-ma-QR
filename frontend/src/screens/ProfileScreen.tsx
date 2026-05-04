import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { LoadingSpinner } from "../components/LoadingSpinner";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SurfaceCard } from "../components/SurfaceCard";
import { theme } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { api, ClassItem, Student } from "../services/api";

export function ProfileScreen() {
  const { user, token, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [children, setChildren] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfileExtra() {
      if (!token || !user) {
        return;
      }

      try {
        setIsLoading(true);

        if (user.role === "teacher") {
          const response = await api.getClasses(token, true);
          setClasses(response.classes);
        } else {
          const response = await api.getMyChildren(token);
          setChildren(response.students);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileExtra();
  }, [token, user]);

  return (
    <Screen>
      <SurfaceCard>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role === "teacher" ? "Giáo viên" : "Phụ huynh"}</Text>
      </SurfaceCard>

      {isLoading ? <LoadingSpinner label="Đang tải thông tin..." /> : null}

      {user?.role === "teacher" ? (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Lớp phụ trách</Text>
          {classes.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.rowTitle}>{item.className}</Text>
              <Text style={styles.rowMeta}>
                Khối {item.grade} - Năm học {item.academicYear || "Chưa rõ"}
              </Text>
            </View>
          ))}
          {!classes.length ? <Text style={styles.emptyText}>Chưa có lớp được gán.</Text> : null}
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Con liên kết</Text>
          {children.map((child) => (
            <View key={child.id} style={styles.row}>
              <Text style={styles.rowTitle}>{child.fullName}</Text>
              <Text style={styles.rowMeta}>
                {child.studentCode} - {child.className}
              </Text>
            </View>
          ))}
          {!children.length ? <Text style={styles.emptyText}>Chưa có học sinh liên kết.</Text> : null}
        </SurfaceCard>
      )}

      <PrimaryButton label="Đăng xuất" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  meta: {
    color: theme.colors.textSoft,
  },
  role: {
    color: theme.colors.primary,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    paddingVertical: 4,
  },
  rowTitle: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  rowMeta: {
    color: theme.colors.textSoft,
  },
  emptyText: {
    color: theme.colors.textSoft,
  },
});
