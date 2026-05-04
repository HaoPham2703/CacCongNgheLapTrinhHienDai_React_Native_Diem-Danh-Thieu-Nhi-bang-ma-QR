import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Picker } from "@react-native-picker/picker";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ErrorToast } from "../../components/ErrorToast";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SurfaceCard } from "../../components/SurfaceCard";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import {
  RootStackParamList,
  TeacherTabParamList,
} from "../../navigation/RootNavigator";
import { Student, api } from "../../services/api";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TeacherTabParamList, "TeacherScanner">,
  NativeStackScreenProps<RootStackParamList>
>;

export function QRScannerScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  async function loadStudents() {
    if (!token) {
      return;
    }

    try {
      setError(null);
      setIsLoadingList(true);
      const response = await api.getStudents(token);
      setStudents(response.students);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không tải được danh sách học sinh",
      );
    } finally {
      setIsLoadingList(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, [token]);

  const canUseCamera = permission?.granted ?? false;

  const scannerHint = useMemo(() => {
    if (!permission) {
      return "Đang kiểm tra quyền camera...";
    }

    if (!permission.granted) {
      return "Cấp quyền camera để quét QR, hoặc dùng phần tìm & điểm danh bên dưới.";
    }

    return "Đưa mã QR của học sinh vào khung quét.";
  }, [permission]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const classOptions = useMemo(() => {
    const collator = new Intl.Collator("vi", { sensitivity: "base" });
    return [...new Set(students.map((student) => student.className))].sort(
      (left, right) => collator.compare(left, right),
    );
  }, [students]);

  const hasActiveFilter =
    normalizedQuery.length > 0 || selectedClass.length > 0;

  const filteredStudents = useMemo(() => {
    if (!hasActiveFilter) {
      return [] as Student[];
    }

    const collator = new Intl.Collator("vi", { sensitivity: "base" });

    return [...students]
      .filter((student) => {
        const matchesClass =
          !selectedClass || student.className === selectedClass;
        const matchesQuery =
          !normalizedQuery ||
          student.fullName.toLowerCase().includes(normalizedQuery) ||
          student.studentCode.toLowerCase().includes(normalizedQuery);

        return matchesClass && matchesQuery;
      })
      .sort((left, right) => collator.compare(left.fullName, right.fullName));
  }, [students, normalizedQuery, selectedClass, hasActiveFilter]);

  async function handleCode(rawValue: string) {
    if (hasScanned || !token) {
      return;
    }

    setHasScanned(true);

    try {
      const matchedStudent = students.find(
        (student) =>
          student.studentCode.toLowerCase() === rawValue.toLowerCase(),
      );

      if (matchedStudent) {
        navigation.navigate("ScanResult", {
          studentId: matchedStudent.id,
          student: matchedStudent,
        });
        return;
      }

      Alert.alert(
        "QR không hợp lệ",
        "Không tìm thấy học sinh phù hợp với mã vừa quét.",
      );
    } finally {
      setTimeout(() => setHasScanned(false), 1500);
    }
  }

  function handlePickStudent(student: Student) {
    navigation.navigate("ScanResult", { studentId: student.id, student });
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 24}
    >
      <Screen>
        <SurfaceCard>
          <Text style={styles.sectionTitle}>Quét nhanh</Text>
          <Text style={styles.sectionText}>{scannerHint}</Text>
          {!permission?.granted ? (
            <PrimaryButton
              label="Cấp quyền camera"
              onPress={() => requestPermission()}
            />
          ) : null}
        </SurfaceCard>

        {canUseCamera ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => handleCode(data)}
            />
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
              </View>
              <Text style={styles.overlayText}>
                Căn mã QR vào giữa khung để quét nhanh hơn
              </Text>
            </View>
          </View>
        ) : null}

        <SurfaceCard>
          <Text style={styles.sectionTitle}>Tìm & Điểm danh</Text>
          <Text style={styles.sectionText}>
            Chọn lớp từ dropdown và/hoặc nhập tên, mã học sinh để tìm nhanh.
          </Text>

          <View style={styles.filtersWrap}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Lớp</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={selectedClass}
                  itemStyle={styles.pickerItem}
                  onValueChange={(value) => setSelectedClass(String(value))}
                  style={styles.picker}
                  dropdownIconColor="#FFFFFF"
                >
                  <Picker.Item label="Chọn lớp" value="" />
                  {classOptions.map((className) => (
                    <Picker.Item
                      key={className}
                      label={className}
                      value={className}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Tên hoặc mã học sinh</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nhập tên học sinh..."
                placeholderTextColor={theme.colors.textSoft}
                style={styles.searchInput}
              />
            </View>
          </View>

          <ErrorToast message={error} />
          {isLoadingList ? (
            <LoadingSpinner label="Đang tải học sinh..." />
          ) : null}

          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable
                style={styles.studentRow}
                onPress={() => handlePickStudent(item)}
              >
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.fullName}</Text>
                  <Text style={styles.studentMeta}>
                    {item.studentCode} - {item.className}
                  </Text>
                </View>
                <Text style={styles.scanLabel}>Điểm danh</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              !isLoadingList ? (
                !hasActiveFilter ? (
                  <Text style={styles.emptyText}>
                    Chưa chọn lớp hoặc chưa nhập từ khóa tìm kiếm.
                  </Text>
                ) : students.length ? (
                  <Text style={styles.emptyText}>
                    Không tìm thấy học sinh phù hợp.
                  </Text>
                ) : (
                  <PrimaryButton
                    label="Tải danh sách học sinh"
                    onPress={loadStudents}
                    variant="secondary"
                  />
                )
              ) : null
            }
          />
        </SurfaceCard>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text,
  },
  sectionText: {
    color: theme.colors.textSoft,
    lineHeight: 21,
  },
  cameraWrap: {
    height: 320,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#0F172A",
    shadowColor: "#020617",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 6,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2, 6, 23, 0.2)",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: "#93C5FD",
  },
  cornerTopLeft: {
    top: -3,
    left: -3,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    top: -3,
    right: -3,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    bottom: -3,
    left: -3,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    right: -3,
    bottom: -3,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 20,
  },
  overlayText: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
  },
  filtersWrap: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  filterGroup: {
    gap: theme.spacing.xs,
  },
  filterLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    overflow: "hidden",
    backgroundColor: theme.colors.card,
    height: 110,
  },
  picker: {
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 0,
    paddingHorizontal: theme.spacing.md,
  },
  pickerItem: { color: "#FFFFFF", fontSize: 18, height: 120 },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
  },
  separator: {
    height: 12,
  },
  studentRow: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.card,
  },
  studentInfo: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  studentMeta: {
    color: theme.colors.textSoft,
    marginTop: 4,
  },
  scanLabel: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  emptyText: {
    color: theme.colors.textSoft,
    textAlign: "center",
    paddingVertical: theme.spacing.md,
  },
});
