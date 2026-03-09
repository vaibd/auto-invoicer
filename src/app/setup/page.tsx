"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Download, ChevronsUpDown, Check } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { saveAs } from "file-saver";
import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";
import { CURRENCIES } from "@/lib/currency";
import { BUILT_IN_TEMPLATES } from "@/lib/date-templates";
import { SenderReceiverForm } from "@/components/invoice/SenderReceiverForm";
import { ProductForm } from "@/components/invoice/ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SetupPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
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
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.sender || !parsed.receiver || !parsed.products) {
          toast.error("Invalid settings file: missing required fields");
          return;
        }
        const imported: UserSettings = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(imported);
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
                  "flex h-12 md:h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                <SelectTrigger className="w-full h-12 md:h-9">
                  <SelectValue>
                    {BUILT_IN_TEMPLATES.find(
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
                </SelectContent>
              </Select>
            </div>
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
