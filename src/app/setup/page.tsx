"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Download, ChevronsUpDown, Check, Trash2, Plus, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { saveAs } from "file-saver";
import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings, clearAllData } from "@/lib/storage";
import { validateImportedSettings } from "@/lib/sanitize";
import { CURRENCIES } from "@/lib/currency";
import {
  BUILT_IN_TEMPLATES,
  TEMPLATE_PRESETS,
  generateTemplateLabel,
} from "@/lib/date-templates";
import { TemplateBase, TemplateMode, CustomDateTemplate } from "@/lib/types";
import { SenderReceiverForm } from "@/components/invoice/SenderReceiverForm";
import { ProductForm } from "@/components/invoice/ProductForm";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function CustomTemplateBuilder({
  onAdd,
}: {
  onAdd: (template: CustomDateTemplate) => void;
}) {
  const [base, setBase] = useState<TemplateBase>("previous");
  const [mode, setMode] = useState<TemplateMode>("first-n");
  const [days, setDays] = useState(7);
  const [customLabel, setCustomLabel] = useState("");

  const autoLabel = generateTemplateLabel(base, mode, days);
  const needsDays = mode === "first-n" || mode === "last-n";

  function handleAdd() {
    onAdd({
      id: `custom-${Date.now()}`,
      label: customLabel.trim() || autoLabel,
      isCustom: true,
      base,
      mode,
      days: needsDays ? days : undefined,
    });
    setCustomLabel("");
  }

  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="text-xs font-medium text-muted-foreground">
        Or build your own
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Base</label>
          <Select value={base} onValueChange={(v) => {
            const b = v as TemplateBase;
            setBase(b);
            if (b === "today" && mode === "full") setMode("last-n");
          }}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous month</SelectItem>
              <SelectItem value="current">Current month</SelectItem>
              <SelectItem value="next">Next month</SelectItem>
              <SelectItem value="today">Relative to today</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Range</label>
          <Select value={mode} onValueChange={(v) => setMode(v as TemplateMode)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {base !== "today" && (
                <SelectItem value="full">Full month</SelectItem>
              )}
              <SelectItem value="first-n">
                {base === "today" ? "Next N days" : "First N days"}
              </SelectItem>
              <SelectItem value="last-n">
                {base === "today" ? "Last N days" : "Last N days"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {needsDays && (
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Number of days
          </label>
          <Input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 font-mono"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          Label (optional)
        </label>
        <Input
          type="text"
          placeholder={autoLabel}
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleAdd}
      >
        <Plus className="size-4" />
        Add Template
      </Button>
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setSettings(getSettings());
    setLoaded(true);
  }, []);

  const updateDropdownPos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    if (!currencyOpen) return;
    updateDropdownPos();
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setCurrencyOpen(false);
    }
    window.addEventListener("scroll", updateDropdownPos, true);
    window.addEventListener("resize", updateDropdownPos);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("scroll", updateDropdownPos, true);
      window.removeEventListener("resize", updateDropdownPos);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [currencyOpen, updateDropdownPos]);

  function handleSave() {
    saveSettings(settings);
    toast.success("Settings saved");
    router.push("/");
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "invoicer-settings.json");
    toast.success("Settings exported");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (text.length > 1_000_000) {
          toast.error("Settings file is too large (max 1 MB)");
          return;
        }
        const parsed = JSON.parse(text);
        const result = validateImportedSettings(parsed);
        if (!result.valid) {
          toast.error(`Invalid settings file: ${result.error}`);
          return;
        }
        setSettings(result.data);
        toast.success("Settings imported — click Save to apply");
      } catch {
        toast.error("Failed to parse settings file");
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be re-imported
    e.target.value = "";
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="font-sans text-3xl font-extrabold tracking-tight">
                Setup
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure your invoice defaults
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Sender / Receiver */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
            <CardContent>
              <SenderReceiverForm
                title="Your Details"
                party={settings.sender}
                onChange={(sender) => setSettings((s) => ({ ...s, sender }))}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent>
              <SenderReceiverForm
                title="Bill To"
                party={settings.receiver}
                onChange={(receiver) =>
                  setSettings((s) => ({ ...s, receiver }))
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Products */}
        <Card className="shadow-sm">
          <CardContent>
            <ProductForm
              products={settings.products}
              onChange={(products) => setSettings((s) => ({ ...s, products }))}
            />
          </CardContent>
        </Card>

        {/* Currency */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-sans font-bold">Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Invoice Currency</Label>
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setCurrencyOpen((o) => !o)}
                className={cn(
                  "flex h-7 w-full items-center justify-between rounded-sm border border-input bg-transparent px-2 text-sm",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                )}>
                <span>
                  {CURRENCIES.find((c) => c.code === settings.currency)
                    ?.label ?? settings.currency}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
              {currencyOpen && createPortal(
                <div
                  ref={dropdownRef}
                  className="fixed z-50 rounded-lg border bg-popover shadow-md"
                  style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                  <Command>
                    <CommandInput placeholder="Search currency..." />
                    <CommandList>
                      <CommandEmpty>No currency found.</CommandEmpty>
                      <CommandGroup>
                        {CURRENCIES.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.label}
                            onSelect={() => {
                              setSettings((s) => ({ ...s, currency: c.code }));
                              setCurrencyOpen(false);
                            }}>
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                settings.currency === c.code
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {c.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>,
                document.body
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-sans font-bold">Footer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="footerText">Invoice Footer Text</Label>
              <Input
                id="footerText"
                type="text"
                value={settings.footerText}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, footerText: e.target.value }))
                }
                placeholder="Thank you for your business!"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to hide the footer on the PDF.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Date Settings */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-sans font-bold">Date Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Default Date Template</Label>
              <Select
                value={settings.defaultTemplateId}
                onValueChange={(v) => {
                  if (v) setSettings((s) => ({ ...s, defaultTemplateId: v }));
                }}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {[...BUILT_IN_TEMPLATES, ...settings.customTemplates].find(
                      (t) => t.id === settings.defaultTemplateId
                    )?.label ?? "Select template"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BUILT_IN_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                  {settings.customTemplates.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Custom
                      </div>
                      {settings.customTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Template Builder */}
            <Accordion>
              <AccordionItem className="border-b-0">
                <AccordionTrigger className="border-t pt-4 rounded-none text-sm font-medium cursor-pointer">
                  Custom Templates
                  {settings.customTemplates.length > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({settings.customTemplates.length})
                    </span>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    {/* Existing custom templates */}
                    {settings.customTemplates.length > 0 && (
                      <div className="space-y-2">
                        {settings.customTemplates.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-md border px-3 py-2"
                          >
                            <span className="text-sm">{t.label}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setSettings((s) => {
                                  const filtered = s.customTemplates.filter(
                                    (ct) => ct.id !== t.id
                                  );
                                  const defaultTemplateId =
                                    s.defaultTemplateId === t.id
                                      ? "last-15-days"
                                      : s.defaultTemplateId;
                                  return {
                                    ...s,
                                    customTemplates: filtered,
                                    defaultTemplateId,
                                  };
                                });
                              }}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick-add presets */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Quick add a preset
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPLATE_PRESETS.filter(
                          (preset) =>
                            !settings.customTemplates.some(
                              (ct) =>
                                ct.base === preset.base &&
                                ct.mode === preset.mode &&
                                ct.days === preset.days
                            )
                        ).map((preset) => {
                          const label = generateTemplateLabel(
                            preset.base,
                            preset.mode,
                            preset.days
                          );
                          return (
                            <Button
                              key={`${preset.base}-${preset.mode}-${preset.days}`}
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                const newTemplate: CustomDateTemplate = {
                                  id: `custom-${Date.now()}`,
                                  label,
                                  isCustom: true,
                                  base: preset.base,
                                  mode: preset.mode,
                                  days: preset.days,
                                };
                                setSettings((s) => ({
                                  ...s,
                                  customTemplates: [
                                    ...s.customTemplates,
                                    newTemplate,
                                  ],
                                }));
                              }}
                            >
                              <Plus className="size-3" />
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom builder */}
                    <CustomTemplateBuilder
                      onAdd={(template) =>
                        setSettings((s) => ({
                          ...s,
                          customTemplates: [...s.customTemplates, template],
                        }))
                      }
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Export & Import */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-sans font-bold">
              Export & Import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Back up your settings or transfer them to another device.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleExport}>
                <Download className="size-4" />
                Export
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-sm border-destructive/30">
          <CardHeader>
            <CardTitle className="font-sans font-bold text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete all settings, invoice numbers, and stored data in the browser.
            </p>
            {confirmDelete ? (
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    clearAllData();
                    toast.success("All data deleted");
                    router.push("/setup");
                    setSettings(DEFAULT_SETTINGS);
                    setConfirmDelete(false);
                  }}
                >
                  <Trash2 className="size-4" />
                  Yes, delete everything
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" />
                Delete All Data
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Save */}
        <div className="pb-8">
          <Button
            size="lg"
            className="w-full h-12 text-base font-sans font-bold shadow-lg shadow-primary/20"
            onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
