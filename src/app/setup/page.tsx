"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { UserSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";
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
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SetupPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    setLoaded(true);
  }, []);

  function handleSave() {
    saveSettings(settings);
    toast.success("Settings saved");
    router.push("/");
  }

  if (!loaded) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 md:space-y-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-2xl font-bold">Setup</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
            </CardHeader>
            <CardContent>
              <SenderReceiverForm
                title="Your Details"
                party={settings.sender}
                onChange={(sender) =>
                  setSettings((s) => ({ ...s, sender }))
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill To (Client)</CardTitle>
            </CardHeader>
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

        <Card>
          <CardHeader>
            <CardTitle>Products / Services</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm
              products={settings.products}
              onChange={(products) =>
                setSettings((s) => ({ ...s, products }))
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Default Date Template</Label>
              <Select
                value={settings.defaultTemplateId}
                onValueChange={(v) => {
                  if (v) setSettings((s) => ({ ...s, defaultTemplateId: v }));
                }}
              >
                <SelectTrigger className="w-full h-12 md:h-9">
                  <SelectValue>
                    {BUILT_IN_TEMPLATES.find((t) => t.id === settings.defaultTemplateId)?.label ?? "Select template"}
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

            <div className="space-y-1.5">
              <Label>Default Month (optional)</Label>
              <Select
                value={
                  settings.defaultMonth !== null
                    ? String(settings.defaultMonth)
                    : "auto"
                }
                onValueChange={(v) => {
                  if (v === null) return;
                  setSettings((s) => ({
                    ...s,
                    defaultMonth: v === "auto" ? null : parseInt(v),
                  }));
                }}
              >
                <SelectTrigger className="w-full h-12 md:h-9">
                  <SelectValue>
                    {settings.defaultMonth !== null
                      ? MONTHS[settings.defaultMonth]
                      : "Auto (previous month)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    Auto (previous month)
                  </SelectItem>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set, templates will use this month instead of the
                previous calendar month.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="pb-8">
          <Button
            size="lg"
            className="w-full h-12 text-base"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
