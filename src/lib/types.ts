export interface Field {
  id: string;
  label: string;
  value: string;
  isBold?: boolean;
}

export interface Party {
  fields: Field[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DateTemplate {
  id: string;
  label: string;
  isCustom?: boolean;
}

export interface CustomDateTemplate extends DateTemplate {
  isCustom: true;
  from: string; // ISO date string
  to: string;   // ISO date string
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: Date;
  from: Date;
  to: Date;
  sender: Party;
  receiver: Party;
  products: Product[];
  currency: string;
}

export interface UserSettings {
  sender: Party;
  receiver: Party;
  products: Product[];
  defaultTemplateId: string;
  defaultMonth: number | null; // 0-11, null = use previous month
  customTemplates: CustomDateTemplate[];
  lastInvoiceNumber: number;
  currency: string;
}

export const DEFAULT_SENDER_FIELDS: Field[] = [
  { id: "name", label: "Name", value: "", isBold: true },
  { id: "email", label: "Email", value: "" },
  { id: "location", label: "Location", value: "" },
];

export const DEFAULT_RECEIVER_FIELDS: Field[] = [
  { id: "name", label: "Name", value: "", isBold: true },
  { id: "email", label: "Email", value: "" },
  { id: "location", label: "Location", value: "" },
];

export const DEFAULT_SETTINGS: UserSettings = {
  sender: { fields: DEFAULT_SENDER_FIELDS },
  receiver: { fields: DEFAULT_RECEIVER_FIELDS },
  products: [],
  defaultTemplateId: "prev-last-15",
  defaultMonth: null,
  customTemplates: [],
  lastInvoiceNumber: 0,
  currency: "USD",
};
