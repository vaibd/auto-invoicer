import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Product } from "@/lib/types";

const styles = StyleSheet.create({
  table: {
    marginTop: 48,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  colName: {
    flex: 3,
    fontSize: 10,
    color: "#333",
  },
  colQty: {
    flex: 1,
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },
  colPrice: {
    flex: 1.5,
    fontSize: 10,
    color: "#333",
    textAlign: "right",
  },
  colAmount: {
    flex: 1.5,
    fontSize: 10,
    color: "#333",
    textAlign: "right",
  },
  headerText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

interface Props {
  products: Product[];
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PDFLineItems({ products }: Props) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.colName, styles.headerText]}>Item</Text>
        <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
        <Text style={[styles.colPrice, styles.headerText]}>Price</Text>
        <Text style={[styles.colAmount, styles.headerText]}>Amount</Text>
      </View>
      {products.map((product) => (
        <View key={product.id} style={styles.row}>
          <Text style={styles.colName}>{product.name}</Text>
          <Text style={styles.colQty}>{product.quantity}</Text>
          <Text style={styles.colPrice}>{formatCurrency(product.price)}</Text>
          <Text style={styles.colAmount}>
            {formatCurrency(product.price * product.quantity)}
          </Text>
        </View>
      ))}
    </View>
  );
}
