import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
    alignItems: "center",
  },
  text: {
    fontSize: 10,
    color: "#999",
  },
});

export function PDFFooter({ text }: { text: string }) {
  if (!text) return null;
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
