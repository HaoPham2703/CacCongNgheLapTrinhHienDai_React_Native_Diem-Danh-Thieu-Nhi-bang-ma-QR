import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { theme } from "../../constants/theme";

type Props = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: number[];
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <View style={styles.container}>
      <View style={styles.summaryGroup}>
        <Text style={styles.summaryText}>
          Hiển thị {startItem}-{endItem} / {totalItems} {itemLabel}
        </Text>
        <View style={styles.pageSizeGroup}>
          {pageSizeOptions.map((option) => {
            const isActive = option === pageSize;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => onPageSizeChange(option)}
                style={[styles.pageSizeButton, isActive && styles.pageSizeButtonActive]}
              >
                <Text style={[styles.pageSizeText, isActive && styles.pageSizeTextActive]}>{option}/trang</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.navigationGroup}>
        <TouchableOpacity
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentPage === 1 && styles.navButtonTextDisabled]}>Trước</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            Trang {currentPage} / {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={[styles.navButton, currentPage === totalPages && styles.navButtonDisabled]}
        >
          <Text
            style={[styles.navButtonText, currentPage === totalPages && styles.navButtonTextDisabled]}
          >
            Sau
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  summaryGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flexWrap: "wrap",
  },
  summaryText: {
    color: theme.colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
  },
  pageSizeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  pageSizeButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pageSizeButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  pageSizeText: {
    color: theme.colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  pageSizeTextActive: {
    color: theme.colors.text,
  },
  navigationGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  navButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  navButtonDisabled: {
    opacity: 0.45,
  },
  navButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  navButtonTextDisabled: {
    color: theme.colors.textSoft,
  },
  pageIndicator: {
    paddingHorizontal: theme.spacing.md,
  },
  pageIndicatorText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
