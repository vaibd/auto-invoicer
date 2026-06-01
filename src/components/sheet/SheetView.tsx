"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Download, X } from "lucide-react";

import { UserSettings, Sheet, SheetRow } from "@/lib/types";
import {
  ensureSheet,
  parseNum,
  computePlatformFees,
  getSheetHeader,
  sheetToCsv,
  createCustomColumn,
  createEmptyRow,
} from "@/lib/sheet";
import { fetchUsdInrRate } from "@/lib/fx-rate";
import { getFinancialYear } from "@/lib/financial-year";
import { sanitizeFilename } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const NUMERIC_COLS = new Set([
  "srNo",
  "amountInr",
  "amountUsd",
  "conversionRate",
  "platformFees",
]);

const PLACEHOLDERS: Record<string, string> = {
  amountInr: "enter…",
};

const cellInputBase =
  "block w-full min-w-[6.5rem] bg-transparent px-2 py-1.5 text-sm outline-none rounded-sm focus:bg-background focus:ring-2 focus:ring-ring/40";

interface SheetViewProps {
  settings: UserSettings;
  onChange: (next: UserSettings) => void;
}

export function SheetView({ settings, onChange }: SheetViewProps) {
  const sheet = ensureSheet(settings.sheet);

  const update = (mutator: (s: Sheet) => Sheet) =>
    onChange({ ...settings, sheet: mutator(sheet) });

  const setFirmName = (firmName: string) => update((s) => ({ ...s, firmName }));

  const patchRow = (rowId: string, patch: Record<string, string>) =>
    update((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.id === rowId ? { ...r, values: { ...r.values, ...patch } } : r
      ),
    }));

  const setCell = (rowId: string, colId: string, value: string) =>
    patchRow(rowId, { [colId]: value });

  const renameColumn = (colId: string, label: string) =>
    update((s) => ({
      ...s,
      columns: s.columns.map((c) => (c.id === colId ? { ...c, label } : c)),
    }));

  const addColumn = () =>
    update((s) => ({ ...s, columns: [...s.columns, createCustomColumn()] }));

  const removeColumn = (colId: string) =>
    update((s) => ({
      ...s,
      columns: s.columns.filter((c) => c.id !== colId),
      rows: s.rows.map((r) => {
        const next: Record<string, string> = {};
        for (const k of Object.keys(r.values)) {
          if (k !== colId) next[k] = r.values[k];
        }
        return { ...r, values: next };
      }),
    }));

  const addRow = () =>
    update((s) => {
      const row = createEmptyRow(s.columns);
      row.values.srNo = String(s.rows.length + 1);
      return { ...s, rows: [...s.rows, row] };
    });

  const deleteRow = (rowId: string) =>
    update((s) => ({
      ...s,
      rows: s.rows
        .filter((r) => r.id !== rowId)
        .map((r, i) => ({ ...r, values: { ...r.values, srNo: String(i + 1) } })),
    }));

  const exportCsv = () => {
    if (sheet.rows.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const csv = sheetToCsv(sheet);
    const base = sanitizeFilename(sheet.firmName || "sheet");
    saveAs(
      new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }),
      `${base}_${getFinancialYear(new Date())}.csv`
    );
    toast.success("Sheet exported");
  };

  return (
    <Card size="sm" className="shadow-sm animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ledger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Heading name + actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <Input
              id="firmName"
              value={sheet.firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. ABC firm"
              className="h-9 w-full sm:w-64"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addRow}
              className="gap-1.5"
            >
              <Plus className="size-4" /> Row
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addColumn}
              className="gap-1.5"
            >
              <Plus className="size-4" /> Column
            </Button>
            <Button size="sm" onClick={exportCsv} className="gap-1.5">
              <Download className="size-4" /> Export CSV
            </Button>
          </div>
        </div>

        {settings.currency !== "USD" && (
          <p className="text-xs text-amber-600 dark:text-amber-500">
            Your invoice currency is {settings.currency}. The “Amount (USD)” column
            stores the invoice total as-is, and the USD→INR math assumes USD.
          </p>
        )}

        {/* Table — scrolls horizontally on mobile */}
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-sm">
            <thead>
              {/* Super-row: heading name + financial year */}
              <tr>
                <th
                  colSpan={sheet.columns.length + 1}
                  className="bg-muted px-3 py-2 text-left text-sm font-bold"
                >
                  {getSheetHeader(sheet.firmName)}
                </th>
              </tr>
              {/* Column headers */}
              <tr className="bg-muted/40">
                {sheet.columns.map((col) => (
                  <th
                    key={col.id}
                    className="border-t border-border/60 px-2 py-1.5 text-left align-middle"
                  >
                    {col.builtin ? (
                      <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {col.label}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <input
                          aria-label="Column name"
                          className="w-28 min-w-0 rounded-sm bg-transparent text-xs font-semibold uppercase tracking-wide outline-none focus:bg-background"
                          value={col.label}
                          onChange={(e) => renameColumn(col.id, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeColumn(col.id)}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="Remove column"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </th>
                ))}
                <th className="w-10 border-t border-border/60 px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {sheet.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={sheet.columns.length + 1}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    No invoices recorded yet. Download an invoice from the Invoice
                    tab to add a row here.
                  </td>
                </tr>
              ) : (
                sheet.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    {sheet.columns.map((col) => (
                      <td
                        key={col.id}
                        className="border-t border-border/60 p-0 align-middle"
                      >
                        {col.id === "platformFees" ? (
                          <RunCell
                            row={row}
                            onPatch={(patch) => patchRow(row.id, patch)}
                          />
                        ) : (
                          <input
                            className={
                              NUMERIC_COLS.has(col.id)
                                ? `${cellInputBase} font-mono tabular-nums`
                                : cellInputBase
                            }
                            value={row.values[col.id] ?? ""}
                            onChange={(e) =>
                              setCell(row.id, col.id, e.target.value)
                            }
                            inputMode={
                              NUMERIC_COLS.has(col.id) ? "decimal" : undefined
                            }
                            placeholder={PLACEHOLDERS[col.id] ?? ""}
                          />
                        )}
                      </td>
                    ))}
                    <td className="border-t border-border/60 px-1 text-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteRow(row.id)}
                        aria-label="Delete row"
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface RunCellProps {
  row: SheetRow;
  onPatch: (patch: Record<string, string>) => void;
}

function RunCell({ row, onPatch }: RunCellProps) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const usd = parseNum(row.values.amountUsd ?? "");
    const inr = parseNum(row.values.amountInr ?? "");
    if (!isFinite(usd) || !isFinite(inr)) {
      toast.error("Enter Amount (USD) and Amount (INR) first");
      return;
    }
    setBusy(true);
    try {
      const { rate } = await fetchUsdInrRate();
      onPatch({
        conversionRate: String(rate),
        platformFees: String(computePlatformFees(usd, rate, inr)),
      });
      toast.success(`Rate ₹${rate.toFixed(2)} — fees calculated`);
    } catch {
      // Fall back to a manually-entered rate if the user has one, else ask for it.
      const typedRate = parseNum(row.values.conversionRate ?? "");
      if (isFinite(typedRate) && typedRate > 0) {
        onPatch({
          platformFees: String(computePlatformFees(usd, typedRate, inr)),
        });
        toast.success("Used the rate already in the row");
      } else {
        toast.error("Couldn't fetch USD→INR rate — enter it manually");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 pr-1.5">
      <input
        className={`${cellInputBase} font-mono tabular-nums`}
        value={row.values.platformFees ?? ""}
        onChange={(e) => onPatch({ platformFees: e.target.value })}
        inputMode="decimal"
      />
      <Button
        variant="outline"
        size="xs"
        onClick={run}
        disabled={busy}
        className="shrink-0"
      >
        {busy ? <Loader2 className="size-3 animate-spin" /> : "Run"}
      </Button>
    </div>
  );
}
