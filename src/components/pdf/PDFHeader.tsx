import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, formatDateRange } from "@/lib/date-templates";

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  accentBar: {
    height: 4,
    backgroundColor: "#1a1a1a",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 14,
    color: "#555",
    textAlign: "right",
  },
  meta: {
    marginTop: 8,
    fontSize: 10,
    color: "#666",
    textAlign: "right",
  },
});

interface Props {
  invoiceNumber: string;
  invoiceDate: Date;
  from: Date;
  to: Date;
}

export function PDFHeader({ invoiceNumber, invoiceDate, from, to }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.accentBar} />
      <View style={styles.row}>
        <Text style={styles.title}>INVOICE</Text>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
          <Text style={styles.meta}>Date: {formatDate(invoiceDate)}</Text>
          <Text style={styles.meta}>
            Period: {formatDateRange(from, to)}
          </Text>
        </View>
      </View>
    </View>
  );
}
