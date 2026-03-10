"use client";

import { Party, Field } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Bold, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const id = `field-${Date.now()}`;
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

  function moveField(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= party.fields.length) return;
    const fields = [...party.fields];
    [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
    onChange({ fields });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-lg font-bold">{title}</h3>
      <div className="space-y-2">
        {party.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-1.5">
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === 0}
                onClick={() => moveField(index, -1)}
                className="h-4 w-5"
              >
                <ChevronUp className="size-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={index === party.fields.length - 1}
                onClick={() => moveField(index, 1)}
                className="h-4 w-5"
              >
                <ChevronDown className="size-3" />
              </Button>
            </div>
            <Input
              value={field.value}
              onChange={(e) =>
                updateField(field.id, { value: e.target.value })
              }
              placeholder={index === 0 ? "Company / Name" : "Field value"}
              className={cn("h-12 md:h-9 flex-1", field.isBold && "font-bold")}
            />
            <Button
              type="button"
              variant={field.isBold ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => updateField(field.id, { isBold: !field.isBold })}
              title="Toggle bold"
            >
              <Bold className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => removeField(field.id)}
              disabled={party.fields.length <= 1}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
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
