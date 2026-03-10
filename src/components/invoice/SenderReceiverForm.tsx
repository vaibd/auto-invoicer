"use client";

import { Party, Field } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Bold, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  title: string;
  party: Party;
  onChange: (party: Party) => void;
}

function SortableField({
  field,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  field: Field;
  index: number;
  onUpdate: (id: string, updates: Partial<Field>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5",
        isDragging && "opacity-50 z-50"
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <Input
        value={field.value}
        onChange={(e) => onUpdate(field.id, { value: e.target.value })}
        placeholder={index === 0 ? "Company / Name" : "Field value"}
        maxLength={500}
        className={cn("flex-1 pb-0 md:pb-1.5", field.isBold && "font-bold")}
      />
      <Button
        type="button"
        variant={field.isBold ? "secondary" : "ghost"}
        size="icon-xs"
        onClick={() => onUpdate(field.id, { isBold: !field.isBold })}
        title="Toggle bold"
      >
        <Bold className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(field.id)}
        disabled={!canRemove}
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </div>
  );
}

export function SenderReceiverForm({ title, party, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = party.fields.findIndex((f) => f.id === active.id);
    const newIndex = party.fields.findIndex((f) => f.id === over.id);
    onChange({ fields: arrayMove(party.fields, oldIndex, newIndex) });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-sans text-lg font-bold">{title}</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={party.fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {party.fields.map((field, index) => (
              <SortableField
                key={field.id}
                field={field}
                index={index}
                onUpdate={updateField}
                onRemove={removeField}
                canRemove={party.fields.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
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
