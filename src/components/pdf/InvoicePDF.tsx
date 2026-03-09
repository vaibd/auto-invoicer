import { Document, Page, View, StyleSheet } from "@react-pdf/renderer";
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
          <PDFPartyInfo label="From" party={data.sender} />
          <PDFPartyInfo label="To" party={data.receiver} />
        </View>
        <PDFLineItems products={data.products} />
        <PDFTotals products={data.products} />
        <PDFFooter />
      </Page>
    </Document>
  );
}
