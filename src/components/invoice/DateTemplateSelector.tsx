"use client";

import { BUILT_IN_TEMPLATES, resolveTemplate, formatDateRange } from "@/lib/date-templates";
import { CustomDateTemplate } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  customTemplates: CustomDateTemplate[];
  defaultMonth: number | null;
}

export function DateTemplateSelector({
  selectedId,
  onSelect,
  customTemplates,
  defaultMonth,
}: Props) {
  const allTemplates = [...BUILT_IN_TEMPLATES, ...customTemplates];
  const resolved = resolveTemplate(selectedId, defaultMonth, customTemplates);

  const selectedLabel =
    allTemplates.find((t) => t.id === selectedId)?.label ?? "Select date template";

  return (
    <div className="space-y-2">
      <Select value={selectedId} onValueChange={(v) => { if (v) onSelect(v); }}>
        <SelectTrigger className="w-full h-12 md:h-9">
          <SelectValue placeholder="Select date template">
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {allTemplates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Period: {formatDateRange(resolved.from, resolved.to)}
      </p>
    </div>
  );
}
