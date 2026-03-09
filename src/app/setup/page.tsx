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
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
          >
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

        {/* Sender / Receiver */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-sm">
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
              onChange={(products) =>
                setSettings((s) => ({ ...s, products }))
              }
            />
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
          </CardContent>
        </Card>

        {/* Save */}
        <div className="pb-8">
          <Button
            size="lg"
            className="w-full h-12 text-base font-sans font-bold shadow-lg shadow-primary/20"
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
