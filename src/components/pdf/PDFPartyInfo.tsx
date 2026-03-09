import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Party } from "@/lib/types";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerRight: {
    flex: 1,
    alignItems: "flex-end" as const,
  },
  label: {
    fontSize: 9,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  fieldBold: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  field: {
    fontSize: 10,
    color: "#444",
    marginBottom: 2,
  },
});

interface Props {
  label: string;
  party: Party;
  align?: "left" | "right";
  showLabel?: boolean;
}

export function PDFPartyInfo({ label, party, align = "left", showLabel = true }: Props) {
  return (
    <View style={align === "right" ? styles.containerRight : styles.container}>
      {showLabel && <Text style={styles.label}>{label}</Text>}
      {party.fields
        .filter((f) => f.value.trim() !== "")
        .map((field) => (
          <Text
            key={field.id}
            style={field.isBold ? styles.fieldBold : styles.field}
          >
            {field.value}
          </Text>
        ))}
    </View>
  );
}
