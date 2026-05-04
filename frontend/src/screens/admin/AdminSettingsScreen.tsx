import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

export function AdminSettingsScreen() {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schoolStartTime, setSchoolStartTime] = useState("07:00");
  const [lateGracePeriodMinutes, setLateGracePeriodMinutes] = useState("10");

  const loadSettings = useCallback(async () => {
    if (!token) return;
    try {
      const response = await api.admin.getAttendanceSettings(token);
      setSchoolStartTime(response.settings.schoolStartTime);
      setLateGracePeriodMinutes(response.settings.lateGracePeriodMinutes.toString());
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải cài đặt");
    }
  }, [token]);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        await loadSettings();
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadSettings]);

  async function handleSave() {
    if (!token) return;

    if (!/^\d{2}:\d{2}$/.test(schoolStartTime)) {
      Alert.alert("Lỗi", "Giờ vào học phải có định dạng HH:MM (ví dụ: 07:00)");
      return;
    }

    const gracePeriod = parseInt(lateGracePeriodMinutes, 10);
    if (isNaN(gracePeriod) || gracePeriod < 0) {
      Alert.alert("Lỗi", "Thời gian dung dị phải là số không âm");
      return;
    }

    try {
      setIsSaving(true);
      await api.admin.updateAttendanceSettings(token, {
        schoolStartTime,
        lateGracePeriodMinutes: gracePeriod,
      });
      Alert.alert("Thành công", "Đã lưu cài đặt");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu cài đặt");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải cài đặt..." />;
  }

  return (
    <Screen>
      <Text style={styles.title}>Cài đặt điểm danh</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Giờ vào học</Text>
        <TextInput
          style={styles.input}
          value={schoolStartTime}
          onChangeText={setSchoolStartTime}
          placeholder="07:00"
          placeholderTextColor={theme.colors.textSoft}
        />
        <Text style={styles.hint}>Định dạng: HH:MM (ví dụ: 07:00)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Thời gian dung dị (phút)</Text>
        <TextInput
          style={styles.input}
          value={lateGracePeriodMinutes}
          onChangeText={setLateGracePeriodMinutes}
          placeholder="10"
          keyboardType="numeric"
          placeholderTextColor={theme.colors.textSoft}
        />
        <Text style={styles.hint}>
          Học sinh đến sau giờ vào học + thời gian dung dị sẽ bị tính là đi trễ
        </Text>
      </View>

      <PrimaryButton label="Lưu cài đặt" onPress={handleSave} disabled={isSaving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSoft,
    marginTop: theme.spacing.sm,
  },
});
