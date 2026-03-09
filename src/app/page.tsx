"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, FileText, Loader2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedTemplate, setSelectedTemplate] = useState("prev-last-15");
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!hasSetup()) {
      router.replace("/setup");
      return;
    }
    const s = getSettings();
    setSettings(s);
    setSelectedTemplate(s.defaultTemplateId);
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
      const invoiceNumber = getNextInvoiceNumber();
      const data = {
        invoiceNumber,
        invoiceDate: new Date(),
        from: resolved.from,
        to: resolved.to,
        sender: settings.sender,
        receiver: settings.receiver,
        products: settings.products,
      };

      const blob = await pdf(<InvoicePDF data={data} />).toBlob();
      saveAs(blob, `${invoiceNumber}.pdf`);
      toast.success(`Invoice #${invoiceNumber} downloaded`);

      // Refresh settings to update invoice number display
      setSettings(getSettings());
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [settings, resolved]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const nextNumber = peekNextInvoiceNumber();
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
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>
            Next invoice: <span className="font-medium text-foreground">#{nextNumber}</span>
          </p>
          <p>
            Invoice date: <span className="font-medium text-foreground">{formatDate(new Date())}</span>
          </p>
        </div>
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
