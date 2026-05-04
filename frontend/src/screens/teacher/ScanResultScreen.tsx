import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ErrorToast } from "../../components/ErrorToast";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SuccessModal } from "../../components/SuccessModal";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { Student, api } from "../../services/api";
import { queueAttendanceRecord } from "../../services/offlineAttendanceQueue";

type Props = NativeStackScreenProps<RootStackParamList, "ScanResult">;

function formatGenderLabel(gender?: Student["gender"]) {
  if (gender === "male") return "Nam";
  if (gender === "female") return "Nữ";
  if (gender === "other") return "Khác";
  return "Chưa cập nhật";
}

export function ScanResultScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const [student, setStudent] = useState<Student | null>(route.params.student || null);
  const [isLoading, setIsLoading] = useState(!route.params.student);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("Đã lưu điểm danh cục bộ");
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFinishedSuccessFlowRef = useRef(false);

  useEffect(() => {
    async function loadStudent() {
      if (!token || route.params.student) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getStudentById(token, route.params.studentId);
        setStudent(response.student);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Không tải được thông tin học sinh");
      } finally {
        setIsLoading(false);
      }
    }

    loadStudent();
  }, [route.params.student, route.params.studentId, token]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  function finishSuccessFlow() {
    if (hasFinishedSuccessFlowRef.current) {
      return;
    }

    hasFinishedSuccessFlowRef.current = true;
    setShowSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "TeacherTabs", params: { screen: "TeacherScanner" } }],
    });
  }

  async function handleSaveOffline() {
    if (!student) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await queueAttendanceRecord(student);
      setSuccessMessage("Đã lưu cục bộ trên thiết bị. Vào Lịch sử để gửi điểm danh khi có mạng.");
      setShowSuccess(true);
      hasFinishedSuccessFlowRef.current = false;
      successTimeoutRef.current = setTimeout(finishSuccessFlow, 1800);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu cục bộ bản ghi điểm danh");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải thông tin học sinh..." />;
  }

  return (
    <Screen>
      <SurfaceCard>
        <Text style={styles.label}>Học sinh</Text>
        <Text style={styles.name}>{student?.fullName || "Không có dữ liệu"}</Text>
        <View style={styles.metaGroup}>
          <Text style={styles.meta}>Mã số: {student?.studentCode || "--"}</Text>
          <Text style={styles.meta}>Lớp: {student?.className || "--"}</Text>
          <Text style={styles.meta}>Giới tính: {formatGenderLabel(student?.gender)}</Text>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.label}>Hành động</Text>
        <Text style={styles.description}>
          Xác nhận lưu điểm danh cục bộ trên thiết bị. Khi có mạng, giáo viên sẽ gửi lại từ màn hình Lịch sử.
        </Text>
        <ErrorToast message={error} />
        {isSubmitting ? <LoadingSpinner label="Đang lưu cục bộ..." /> : null}
        <PrimaryButton
          label={isSubmitting ? "Đang lưu..." : "Lưu cục bộ"}
          onPress={handleSaveOffline}
          disabled={isSubmitting || !student}
        />
        <PrimaryButton label="Quay lại quét" onPress={() => navigation.goBack()} variant="secondary" />
      </SurfaceCard>

      <SuccessModal visible={showSuccess} message={successMessage} onClose={finishSuccessFlow} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: theme.colors.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  name: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  metaGroup: {
    gap: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.textSoft,
    fontSize: 15,
  },
  description: {
    color: theme.colors.textSoft,
    lineHeight: 21,
  },
});
