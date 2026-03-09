"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, FileText, Loader2, Minus, Plus } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { toast } from "sonner";

import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, hasSetup } from "@/lib/storage";
import {
  resolveTemplate,
  resolveForMonth,
  formatDate,
  formatDateRange,
  RANGE_OPTIONS,
  type RangeType,
} from "@/lib/date-templates";
import { getNextInvoiceNumber, peekNextInvoiceNumber } from "@/lib/invoice-number";
import { DateTemplateSelector } from "@/components/invoice/DateTemplateSelector";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [selectedTemplate, setSelectedTemplate] = useState("prev-last-15");
  const [generating, setGenerating] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "custom">("current");
  const [customMonth, setCustomMonth] = useState(() => {
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    return prev.getMonth();
  });
  const [customYear, setCustomYear] = useState(() => new Date().getFullYear());
  const [customRange, setCustomRange] = useState<RangeType>("full");

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
    setLoaded(true);
  }, [router]);

  const adjustInvoiceNumber = (delta: number) => {
    const match = invoiceNumber.match(/^(.*?)(\d+)$/);
    if (!match) return;
    const prefix = match[1];
    const padLen = match[2].length;
    const newNum = Math.max(1, parseInt(match[2], 10) + delta);
    setInvoiceNumber(`${prefix}${String(newNum).padStart(padLen, "0")}`);
  };

  const resolved =
    activeTab === "custom"
      ? resolveForMonth(customMonth, customYear, customRange)
      : resolveTemplate(selectedTemplate, settings.defaultMonth, settings.customTemplates);

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

      const pdfFileName = invoiceNumber.endsWith(".pdf") ? invoiceNumber : `${invoiceNumber}.pdf`;
      const blob = await pdf(<InvoicePDF data={data} />).toBlob();
      saveAs(blob, pdfFileName);
      toast.success(`Invoice #${invoiceNumber} downloaded`);

      // Refresh settings and set next invoice number
      const s = getSettings();
      setSettings(s);
      const nextNum = peekNextInvoiceNumber();
      setInvoiceNumber(nextNum);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [settings, resolved, invoiceNumber]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary/60" />
      </div>
    );
  }

  const total = settings.products.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight">
              Invoices
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and download PDF invoices
            </p>
          </div>
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

        {/* Party Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card size="sm" className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                From
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
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
              </div>
            </CardContent>
          </Card>

          <Card size="sm" className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bill To
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Summary */}
        <Card size="sm" className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products configured</p>
            ) : (
              <div className="space-y-2">
                {settings.products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        x{p.quantity}
                      </span>
                    </span>
                    <span className="font-mono text-sm font-medium tabular-nums">
                      ${(p.price * p.quantity).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-3 mt-3">
                  <span className="font-sans text-sm font-bold">Total</span>
                  <span className="font-mono text-base font-bold tabular-nums">
                    ${total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Period & Details */}
        <Card size="sm" className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Invoice Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "current" | "custom")}
            >
              <TabsList>
                <TabsTrigger value="current">Current</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="current">
                <div className="space-y-4">
                  <DateTemplateSelector
                    selectedId={selectedTemplate}
                    onSelect={setSelectedTemplate}
                    customTemplates={settings.customTemplates}
                    defaultMonth={settings.defaultMonth}
                  />
                </div>
              </TabsContent>

              <TabsContent value="custom">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Month
                      </label>
                      <Select
                        value={customMonth}
                        onValueChange={(v) => { if (v !== null) setCustomMonth(v as number); }}
                      >
                        <SelectTrigger className="w-full h-12 md:h-9">
                          <SelectValue>
                            {new Date(2000, customMonth).toLocaleString("en-US", { month: "long" })}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i} value={i}>
                              {new Date(2000, i).toLocaleString("en-US", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        Year
                      </label>
                      <Select
                        value={customYear}
                        onValueChange={(v) => { if (v !== null) setCustomYear(v as number); }}
                      >
                        <SelectTrigger className="w-full h-12 md:h-9">
                          <SelectValue>{customYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => {
                            const y = new Date().getFullYear() - 2 + i;
                            return (
                              <SelectItem key={y} value={y}>
                                {y}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Range
                    </label>
                    <Select
                      value={customRange}
                      onValueChange={(v) => { if (v) setCustomRange(v as RangeType); }}
                    >
                      <SelectTrigger className="w-full h-12 md:h-9">
                        <SelectValue>
                          {RANGE_OPTIONS.find((o) => o.value === customRange)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {RANGE_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Period: {formatDateRange(resolved.from, resolved.to)}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Invoice Details — shared across tabs */}
            <div className="space-y-4 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Invoice Details
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="invoiceNumber">
                  Invoice Number / File Name
                </label>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 size-9"
                    onClick={() => adjustInvoiceNumber(-1)}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="font-mono text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 size-9"
                    onClick={() => adjustInvoiceNumber(1)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">.pdf will be appended automatically</p>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-1">
                Invoice date: <span className="font-medium text-foreground">{formatDate(new Date())}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4">
        <div className="mx-auto max-w-2xl">
          <Button
            size="lg"
            className="w-full h-12 text-base gap-2 font-sans font-bold shadow-lg shadow-primary/20"
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
