"use client";

import { Party, Field } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  title: string;
  party: Party;
  onChange: (party: Party) => void;
}

export function SenderReceiverForm({ title, party, onChange }: Props) {
  function updateField(id: string, updates: Partial<Field>) {
    onChange({
      fields: party.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  }

  function addField() {
    const id = `custom-${Date.now()}`;
    onChange({
      fields: [
        ...party.fields,
        { id, label: "", value: "", isBold: false },
      ],
    });
  }

  function removeField(id: string) {
    onChange({
      fields: party.fields.filter((f) => f.id !== id),
    });
  }

  const isDefault = (id: string) =>
    ["name", "email", "location"].includes(id);

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-lg font-bold">{title}</h3>
      <div className="space-y-3">
        {party.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            {isDefault(field.id) && (
              <Label htmlFor={`${title}-${field.id}`}>{field.label}</Label>
            )}
            <div className="flex items-center gap-2">
              <Input
                id={`${title}-${field.id}`}
                value={field.value}
                onChange={(e) =>
                  updateField(field.id, { value: e.target.value })
                }
                placeholder={isDefault(field.id) ? field.label : "Custom field"}
                type={field.id === "email" ? "email" : "text"}
                className="h-12 md:h-9"
              />
              {!isDefault(field.id) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addField}
        className="gap-1"
      >
        <Plus className="size-3.5" />
        Add field
      </Button>
    </div>
  );
}
