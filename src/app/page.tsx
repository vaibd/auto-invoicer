"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, FileText, Loader2, Pencil } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, hasSetup } from "@/lib/storage";
import { resolveTemplate, formatDate } from "@/lib/date-templates";
import { getNextInvoiceNumber, peekNextInvoiceNumber } from "@/lib/invoice-number";
import { DateTemplateSelector } from "@/components/invoice/DateTemplateSelector";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedTemplate, setSelectedTemplate] = useState("prev-last-15");
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileNameManuallyEdited, setFileNameManuallyEdited] = useState(false);

  useEffect(() => {
    if (!hasSetup()) {
      router.replace("/setup");
      return;
    }
    const s = getSettings();
    setSettings(s);
    setSelectedTemplate(s.defaultTemplateId);
    const nextNum = peekNextInvoiceNumber();
    setInvoiceNumber(nextNum);
    setFileName(nextNum);
    setLoaded(true);
  }, [router]);

  const resolved = resolveTemplate(
    selectedTemplate,
    settings.defaultMonth,
    settings.customTemplates
  );

  const handleGenerate = useCallback(async () => {
    if (settings.products.length === 0) {
      toast.error("No products configured. Go to Setup to add products.");
      return;
    }
    setGenerating(true);
    try {
      // Increment the persistent counter
      getNextInvoiceNumber();

      const data = {
        invoiceNumber,
        invoiceDate: new Date(),
        from: resolved.from,
        to: resolved.to,
        sender: settings.sender,
        receiver: settings.receiver,
        products: settings.products,
      };

      const pdfFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const blob = await pdf(<InvoicePDF data={data} />).toBlob();
      saveAs(blob, pdfFileName);
      toast.success(`Invoice #${invoiceNumber} downloaded`);

      // Refresh settings and set next invoice number
      const s = getSettings();
      setSettings(s);
      const nextNum = peekNextInvoiceNumber();
      setInvoiceNumber(nextNum);
      if (!fileNameManuallyEdited) {
        setFileName(nextNum);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [settings, resolved, invoiceNumber, fileName, fileNameManuallyEdited]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = settings.products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 md:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Invoice Generator</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/setup")}
            className="gap-1.5"
          >
            <Settings className="size-4" />
            Setup
          </Button>
        </div>

        {/* Sender / Receiver Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                From
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.sender.fields
                .filter((f) => f.value.trim())
                .map((f) => (
                  <p
                    key={f.id}
                    className={f.isBold ? "font-semibold" : "text-sm text-muted-foreground"}
                  >
                    {f.value}
                  </p>
                ))}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                To
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings.receiver.fields
                .filter((f) => f.value.trim())
                .map((f) => (
                  <p
                    key={f.id}
                    className={f.isBold ? "font-semibold" : "text-sm text-muted-foreground"}
                  >
                    {f.value}
                  </p>
                ))}
            </CardContent>
          </Card>
        </div>

        {/* Products Summary */}
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products configured</p>
            ) : (
              <div className="space-y-1">
                {settings.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm"
                  >
                    <span>
                      {p.name}{" "}
                      <span className="text-muted-foreground">
                        x{p.quantity}
                      </span>
                    </span>
                    <span className="font-medium">
                      ${(p.price * p.quantity).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t font-semibold">
                  <span>Total</span>
                  <span>
                    ${total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Date Template */}
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Invoice Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DateTemplateSelector
              selectedId={selectedTemplate}
              onSelect={setSelectedTemplate}
              customTemplates={settings.customTemplates}
              defaultMonth={settings.defaultMonth}
            />
          </CardContent>
        </Card>

        {/* Invoice Info */}
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="invoiceNumber">
                Invoice Number
              </label>
              <div className="relative">
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => {
                    setInvoiceNumber(e.target.value);
                    if (!fileNameManuallyEdited) {
                      setFileName(e.target.value);
                    }
                  }}
                  className="pr-8"
                />
                <Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="fileName">
                File Name
              </label>
              <div className="relative">
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(e) => {
                    setFileName(e.target.value);
                    setFileNameManuallyEdited(true);
                  }}
                  className="pr-8"
                />
                <Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">.pdf will be appended automatically</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Invoice date: <span className="font-medium text-foreground">{formatDate(new Date())}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="mx-auto max-w-2xl">
          <Button
            size="lg"
            className="w-full h-12 text-base gap-2"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="size-5" />
                Generate Invoice
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
