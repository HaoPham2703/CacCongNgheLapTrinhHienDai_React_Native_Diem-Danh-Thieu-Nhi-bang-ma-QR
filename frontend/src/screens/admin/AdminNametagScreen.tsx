import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { LoadingSpinner } from "../../components/LoadingSpinner";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { theme } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { api, Student } from "../../services/api";

export function AdminNametagScreen() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const qrRefs = useRef<{ [key: string]: any }>({});

  const loadStudents = useCallback(async () => {
    if (!token) return;
    const response = await api.getStudents(token);
    setStudents(response.students.filter((s) => s.isActive));
  }, [token]);

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        await loadStudents();
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [loadStudents]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        body * {
          display: none !important;
        }
        #nametag-print-area {
          display: flex !important;
        }
        #nametag-print-area,
        #nametag-print-area * {
          display: block !important;
          visibility: visible !important;
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        #nametag-print-area {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 10mm;
          margin: 0 !important;
          padding: 0 !important;
        }
        .nametag-card {
          width: 130mm;
          height: 80mm;
          border: 2px solid #60A5FA;
          border-radius: 8px;
          padding: 5mm;
          background: white;
          box-sizing: border-box;
          break-inside: avoid;
          page-break-inside: avoid;
          margin: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Đang tải danh sách học sinh..." />;
  }

  return (
    <Screen scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Thẻ học sinh</Text>
        <PrimaryButton label="Xuất PDF" onPress={handlePrint} />
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.grid} nativeID="nametag-print-area">
          {students.map((student) => (
            <View key={student.id} style={styles.card} className="nametag-card">
              <View style={styles.cardHeader}>
                <Text style={styles.schoolName}>ClassPulse</Text>
                <Text style={styles.cardTitle}>T H Ẻ  H Ọ C  S I N H</Text>
              </View>

              <View style={styles.qrContainer}>
                <QRCode
                  value={student.id}
                  size={100}
                  getRef={(ref) => (qrRefs.current[student.id] = ref)}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.studentName}>{student.fullName}</Text>
                <Text style={styles.studentCode}>{student.studentCode}</Text>
                <Text style={styles.className}>{student.className}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  scroll: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  card: {
    width: 340,
    height: 207,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#60A5FA",
    padding: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  schoolName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#60A5FA",
    textAlign: "center",
  },
  cardTitle: {
    fontSize: 8,
    color: "#94A3B8",
    letterSpacing: 3,
    marginTop: 2,
    textAlign: "center",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  cardFooter: {
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  studentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  studentCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#60A5FA",
    textAlign: "center",
    marginTop: 2,
  },
  className: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 1,
  },
});
