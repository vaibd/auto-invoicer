import { Document, Page, View, Font, StyleSheet } from "@react-pdf/renderer";
import { InvoiceData } from "@/lib/types";
import { PDFHeader } from "./PDFHeader";
import { PDFPartyInfo } from "./PDFPartyInfo";
import { PDFLineItems } from "./PDFLineItems";
import { PDFTotals } from "./PDFTotals";
import { PDFFooter } from "./PDFFooter";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#333",
  },
  partyRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
});

interface Props {
  data: InvoiceData;
}

export function InvoicePDF({ data }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader
          invoiceNumber={data.invoiceNumber}
          invoiceDate={data.invoiceDate}
          from={data.from}
          to={data.to}
        />
        <View style={styles.partyRow}>
          <PDFPartyInfo label="Your Details" party={data.sender} showLabel={false} />
          <PDFPartyInfo label="Bill To" party={data.receiver} align="right" />
        </View>
        <PDFLineItems products={data.products} currency={data.currency} />
        <PDFTotals products={data.products} currency={data.currency} />
        <PDFFooter />
      </Page>
    </Document>
  );
}
