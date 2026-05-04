import Feather from "@expo/vector-icons/Feather";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { theme } from "../../constants/theme";

type QRModalProps = {
  visible: boolean;
  studentCode: string;
  studentName: string;
  onClose: () => void;
};

export function QRModal({ visible, studentCode, studentName, onClose }: QRModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Mã QR học sinh</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <QRCode value={studentCode} size={200} backgroundColor="white" />
          </View>

          <View style={styles.info}>
            <Text style={styles.studentCode}>{studentCode}</Text>
            <Text style={styles.studentName}>{studentName}</Text>
          </View>

          <Text style={styles.hint}>Dùng mã QR này để điểm danh nhanh</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: theme.spacing.xl,
    width: 360,
    maxWidth: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  qrContainer: {
    alignItems: "center",
    padding: theme.spacing.xl,
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
  },
  info: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  studentCode: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  studentName: {
    color: theme.colors.text,
    fontSize: 16,
  },
  hint: {
    color: theme.colors.textSoft,
    fontSize: 14,
    textAlign: "center",
  },
});
