import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Product } from "@/lib/types";

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#1a1a1a",
    minWidth: 200,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginRight: 24,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
});

interface Props {
  products: Product[];
}

export function PDFTotals({ products }: Props) {
  const total = products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>
          ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>
    </View>
  );
}
