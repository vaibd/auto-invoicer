import {
  UserSettings,
  DEFAULT_SETTINGS,
  BUILTIN_COLUMNS,
  type Field,
  type Product,
  type CustomDateTemplate,
  type TemplateBase,
  type TemplateMode,
  type SheetColumn,
  type SheetRow,
  type Party,
  type InvoiceSnapshot,
} from "./types";

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively strip prototype-polluting keys from parsed JSON.
 */
export function stripPrototypeKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(stripPrototypeKeys);
  }

  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    cleaned[key] = stripPrototypeKeys(
      (obj as Record<string, unknown>)[key]
    );
  }
  return cleaned;
}

/**
 * Merge untrusted parsed JSON into a defaults object, stripping
 * prototype-polluting keys first.
 */
export function safeMerge<T>(defaults: T, untrusted: unknown): T {
  const stripped = stripPrototypeKeys(untrusted);
  if (stripped === null || typeof stripped !== "object" || Array.isArray(stripped)) {
    return defaults;
  }
  return { ...defaults, ...(stripped as Partial<T>) };
}

/**
 * Sanitize a string for use as a filename.
 */
export function sanitizeFilename(name: string): string {
  let safe = name
    // Remove filesystem-dangerous characters and control chars
    .replace(/[/\\:*?"<>|\x00-\x1f]/g, "")
    // Collapse consecutive dashes/spaces
    .replace(/[-\s]+/g, (m) => m[0])
    .trim();

  // Truncate to 200 characters
  if (safe.length > 200) safe = safe.slice(0, 200);

  return safe || "invoice";
}

// --- Import validation helpers ---

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function truncStr(v: string, max: number): string {
  return v.length > max ? v.slice(0, max) : v;
}

function validateField(v: unknown): Field | null {
  if (!isPlainObject(v)) return null;
  if (typeof v.id !== "string" || typeof v.label !== "string" || typeof v.value !== "string") return null;
  const field: Field = {
    id: truncStr(v.id, 1000),
    label: truncStr(v.label, 1000),
    value: truncStr(v.value, 1000),
  };
  if (typeof v.isBold === "boolean") field.isBold = v.isBold;
  return field;
}

function validateProduct(v: unknown): Product | null {
  if (!isPlainObject(v)) return null;
  if (typeof v.id !== "string" || typeof v.name !== "string") return null;
  if (typeof v.price !== "number" || !isFinite(v.price) || v.price < 0) return null;
  if (typeof v.quantity !== "number" || !isFinite(v.quantity) || v.quantity < 0 || !Number.isInteger(v.quantity)) return null;
  return {
    id: truncStr(v.id, 1000),
    name: truncStr(v.name, 1000),
    price: v.price,
    quantity: v.quantity,
  };
}

const VALID_BASES: TemplateBase[] = ["previous", "current", "next", "today"];
const VALID_MODES: TemplateMode[] = ["full", "first-n", "last-n"];

function validateCustomTemplate(v: unknown): CustomDateTemplate | null {
  if (!isPlainObject(v)) return null;
  if (typeof v.id !== "string" || typeof v.label !== "string") return null;
  if (v.isCustom !== true) return null;
  if (typeof v.base !== "string" || !VALID_BASES.includes(v.base as TemplateBase)) return null;
  if (typeof v.mode !== "string" || !VALID_MODES.includes(v.mode as TemplateMode)) return null;
  const tpl: CustomDateTemplate = {
    id: truncStr(v.id, 1000),
    label: truncStr(v.label, 1000),
    isCustom: true,
    base: v.base as TemplateBase,
    mode: v.mode as TemplateMode,
  };
  if (typeof v.days === "number" && isFinite(v.days) && v.days > 0) {
    tpl.days = Math.floor(v.days);
  }
  return tpl;
}

function validateParty(v: unknown): Party | null {
  if (!isPlainObject(v) || !Array.isArray(v.fields)) return null;
  const fields: Field[] = [];
  for (const f of (v.fields as unknown[]).slice(0, 100)) {
    const vf = validateField(f);
    if (vf) fields.push(vf);
  }
  return { fields };
}

function validateInvoiceSnapshot(v: unknown): InvoiceSnapshot | undefined {
  if (!isPlainObject(v)) return undefined;
  if (typeof v.invoiceNumber !== "string") return undefined;
  if (typeof v.invoiceDate !== "string" || typeof v.from !== "string" || typeof v.to !== "string") return undefined;
  const sender = validateParty(v.sender);
  const receiver = validateParty(v.receiver);
  if (!sender || !receiver) return undefined;
  if (!Array.isArray(v.products)) return undefined;
  const products: Product[] = [];
  for (const p of (v.products as unknown[]).slice(0, 100)) {
    const vp = validateProduct(p);
    if (vp) products.push(vp);
  }
  return {
    invoiceNumber: truncStr(v.invoiceNumber, 1000),
    invoiceDate: truncStr(v.invoiceDate, 100),
    from: truncStr(v.from, 100),
    to: truncStr(v.to, 100),
    sender,
    receiver,
    products,
    currency: typeof v.currency === "string" ? truncStr(v.currency, 1000) : "USD",
    footerText: typeof v.footerText === "string" ? truncStr(v.footerText, 500) : "",
  };
}

function validateSheetColumn(v: unknown): SheetColumn | null {
  if (!isPlainObject(v)) return null;
  if (typeof v.id !== "string" || typeof v.label !== "string") return null;
  return {
    id: truncStr(v.id, 200),
    label: truncStr(v.label, 200),
    builtin: v.builtin === true,
  };
}

function validateSheetRow(v: unknown, colIds: Set<string>): SheetRow | null {
  if (!isPlainObject(v)) return null;
  if (typeof v.id !== "string") return null;
  if (!isPlainObject(v.values)) return null;
  const rawValues = v.values as Record<string, unknown>;
  const values: Record<string, string> = {};
  for (const k of Object.keys(rawValues)) {
    if (!colIds.has(k)) continue; // drop orphan cell keys (columns that no longer exist)
    const cell = rawValues[k];
    if (typeof cell === "string") values[k] = truncStr(cell, 1000);
    else if (typeof cell === "number" && isFinite(cell)) values[k] = String(cell);
  }
  const row: SheetRow = { id: truncStr(v.id, 200), values };
  const invoice = validateInvoiceSnapshot(v.invoice);
  if (invoice) row.invoice = invoice;
  return row;
}

type ValidationResult =
  | { valid: true; data: UserSettings }
  | { valid: false; error: string };

/**
 * Validate imported settings JSON against the UserSettings shape.
 */
export function validateImportedSettings(parsed: unknown): ValidationResult {
  const stripped = stripPrototypeKeys(parsed);
  if (!isPlainObject(stripped)) {
    return { valid: false, error: "Settings must be a JSON object" };
  }

  const obj = stripped as Record<string, unknown>;

  // --- sender ---
  if (!isPlainObject(obj.sender) || !Array.isArray((obj.sender as Record<string, unknown>).fields)) {
    return { valid: false, error: "Missing or invalid 'sender' with 'fields' array" };
  }
  const senderFields = ((obj.sender as Record<string, unknown>).fields as unknown[]).slice(0, 100);
  const validatedSenderFields: Field[] = [];
  for (const f of senderFields) {
    const vf = validateField(f);
    if (!vf) return { valid: false, error: "Invalid field in sender.fields" };
    validatedSenderFields.push(vf);
  }

  // --- receiver ---
  if (!isPlainObject(obj.receiver) || !Array.isArray((obj.receiver as Record<string, unknown>).fields)) {
    return { valid: false, error: "Missing or invalid 'receiver' with 'fields' array" };
  }
  const receiverFields = ((obj.receiver as Record<string, unknown>).fields as unknown[]).slice(0, 100);
  const validatedReceiverFields: Field[] = [];
  for (const f of receiverFields) {
    const vf = validateField(f);
    if (!vf) return { valid: false, error: "Invalid field in receiver.fields" };
    validatedReceiverFields.push(vf);
  }

  // --- products ---
  if (!Array.isArray(obj.products)) {
    return { valid: false, error: "Missing or invalid 'products' array" };
  }
  const products = (obj.products as unknown[]).slice(0, 100);
  const validatedProducts: Product[] = [];
  for (const p of products) {
    const vp = validateProduct(p);
    if (!vp) return { valid: false, error: "Invalid product: each must have id, name (strings), price (>= 0), quantity (non-negative integer)" };
    validatedProducts.push(vp);
  }

  // --- optional fields ---
  const result: UserSettings = {
    ...DEFAULT_SETTINGS,
    sender: { fields: validatedSenderFields },
    receiver: { fields: validatedReceiverFields },
    products: validatedProducts,
  };

  if (typeof obj.defaultTemplateId === "string") {
    result.defaultTemplateId = truncStr(obj.defaultTemplateId, 1000);
  }

  if (obj.defaultMonth === null) {
    result.defaultMonth = null;
  } else if (typeof obj.defaultMonth === "number" && Number.isInteger(obj.defaultMonth) && obj.defaultMonth >= 0 && obj.defaultMonth <= 11) {
    result.defaultMonth = obj.defaultMonth;
  }

  if (Array.isArray(obj.customTemplates)) {
    const templates = (obj.customTemplates as unknown[]).slice(0, 100);
    const validatedTemplates: CustomDateTemplate[] = [];
    for (const t of templates) {
      const vt = validateCustomTemplate(t);
      if (!vt) return { valid: false, error: "Invalid custom template" };
      validatedTemplates.push(vt);
    }
    result.customTemplates = validatedTemplates;
  }

  if (typeof obj.lastInvoiceNumber === "number" && isFinite(obj.lastInvoiceNumber) && Number.isInteger(obj.lastInvoiceNumber) && obj.lastInvoiceNumber >= 0) {
    result.lastInvoiceNumber = obj.lastInvoiceNumber;
  }

  if (typeof obj.invoiceNumberPrefix === "string") {
    result.invoiceNumberPrefix = truncStr(obj.invoiceNumberPrefix, 100);
  }

  if (typeof obj.invoiceNumberPadLength === "number" && Number.isInteger(obj.invoiceNumberPadLength) && obj.invoiceNumberPadLength >= 0 && obj.invoiceNumberPadLength <= 20) {
    result.invoiceNumberPadLength = obj.invoiceNumberPadLength;
  }

  if (typeof obj.includeFyInFilename === "boolean") {
    result.includeFyInFilename = obj.includeFyInFilename;
  }

  if (typeof obj.currency === "string") {
    result.currency = truncStr(obj.currency, 1000);
  }

  if (typeof obj.footerText === "string") {
    result.footerText = truncStr(obj.footerText, 500);
  }

  // --- sheet (ledger) — optional; defaults to DEFAULT_SHEET via DEFAULT_SETTINGS ---
  if (isPlainObject(obj.sheet)) {
    const sObj = obj.sheet as Record<string, unknown>;
    const cols: SheetColumn[] = [];
    if (Array.isArray(sObj.columns)) {
      for (const c of (sObj.columns as unknown[]).slice(0, 50)) {
        const vc = validateSheetColumn(c);
        if (vc) cols.push(vc);
      }
    }
    const finalCols = cols.length > 0 ? cols : BUILTIN_COLUMNS.map((c) => ({ ...c }));
    const colIds = new Set(finalCols.map((c) => c.id));
    const rows: SheetRow[] = [];
    if (Array.isArray(sObj.rows)) {
      for (const r of (sObj.rows as unknown[]).slice(0, 1000)) {
        const vr = validateSheetRow(r, colIds);
        if (vr) rows.push(vr);
      }
    }
    result.sheet = {
      firmName: typeof sObj.firmName === "string" ? truncStr(sObj.firmName, 200) : "",
      columns: finalCols,
      rows,
    };
  }

  return { valid: true, data: result };
}
